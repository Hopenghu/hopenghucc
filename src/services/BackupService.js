export class BackupService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
    }

    /**
     * 創建資料庫備份
     * @returns {Promise<object>} 備份結果
     */
    async createBackup() {
        try {
            console.log('[BackupService] Starting database backup...');
            
            // 獲取所有表的資料
            const tables = await this.getTables();
            console.log(`[BackupService] Found ${tables.length} tables to backup:`, tables);
            
            // 計算總行數
            let totalRows = 0;
            const tableStats = {};
            
            for (const table of tables) {
                try {
                    console.log(`[BackupService] Counting rows in table: ${table}`);
                    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
                    const result = await countStmt.first();
                    const rowCount = result.count;
                    tableStats[table] = rowCount;
                    totalRows += rowCount;
                } catch (tableError) {
                    console.error(`[BackupService] Failed to count rows in table ${table}:`, tableError);
                    tableStats[table] = 0;
                }
            }

            // 生成備份鍵
            const backupKey = `backup_${Date.now()}`;
            const timestamp = new Date().toISOString();
            
            // 記錄備份歷史到資料庫
            await this.recordBackupHistory(backupKey, {
                timestamp,
                tableCount: tables.length,
                totalRows,
                tableStats
            });

            console.log(`[BackupService] Backup completed: ${backupKey}`);
            return {
                success: true,
                backupKey,
                timestamp,
                tableCount: tables.length,
                totalRows,
                message: `成功備份 ${tables.length} 個表格，共 ${totalRows} 行資料`
            };

        } catch (error) {
            console.error('[BackupService] Backup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 獲取所有表名
     */
    async getTables() {
        const stmt = this.db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%'
            AND name NOT LIKE '_cf_%'
            AND name NOT LIKE 'd1_%'
            ORDER BY name
        `);
        const { results } = await stmt.all();
        return results.map(row => row.name);
    }

    /**
     * 備份單個表
     */
    async backupTable(tableName) {
        // 獲取表結構
        const schemaStmt = this.db.prepare(`
            SELECT sql FROM sqlite_master 
            WHERE type='table' AND name = ?
        `);
        const schema = await schemaStmt.bind(tableName).first();

        // 獲取表資料
        const dataStmt = this.db.prepare(`SELECT * FROM ${tableName}`);
        const { results } = await dataStmt.all();

        return {
            schema: schema.sql,
            data: results,
            rowCount: results.length
        };
    }

    /**
     * 記錄備份歷史
     */
    async recordBackupHistory(backupKey, backup) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO backup_history 
                (backup_key, timestamp, table_count, total_rows, status)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            const totalRows = Object.values(backup.tables)
                .reduce((sum, table) => sum + table.rowCount, 0);
            
            await stmt.bind(
                backupKey,
                backup.timestamp,
                Object.keys(backup.tables).length,
                totalRows,
                'completed'
            ).run();
        } catch (error) {
            console.error('[BackupService] Failed to record backup history:', error);
        }
    }

    /**
     * 恢復資料庫備份
     * @param {string} backupKey 備份鍵
     * @returns {Promise<object>} 恢復結果
     */
    async restoreBackup(backupKey) {
        try {
            console.log(`[BackupService] Starting restore from backup: ${backupKey}`);
            
            // 獲取備份資料
            const backupData = await this.env.BACKUP_KV.get(backupKey);
            if (!backupData) {
                throw new Error('Backup not found');
            }

            const backup = JSON.parse(backupData);
            
            // 開始恢復
            for (const [tableName, tableData] of Object.entries(backup.tables)) {
                await this.restoreTable(tableName, tableData);
            }

            console.log(`[BackupService] Restore completed from: ${backupKey}`);
            return {
                success: true,
                backupKey,
                timestamp: backup.timestamp,
                tableCount: Object.keys(backup.tables).length
            };

        } catch (error) {
            console.error('[BackupService] Restore failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 恢復單個表
     */
    async restoreTable(tableName, tableData) {
        // 刪除現有表
        await this.db.prepare(`DROP TABLE IF EXISTS ${tableName}`).run();
        
        // 重新創建表
        await this.db.prepare(tableData.schema).run();
        
        // 插入資料
        if (tableData.data.length > 0) {
            const columns = Object.keys(tableData.data[0]);
            const placeholders = columns.map(() => '?').join(', ');
            const stmt = this.db.prepare(`
                INSERT INTO ${tableName} (${columns.join(', ')}) 
                VALUES (${placeholders})
            `);
            
            for (const row of tableData.data) {
                await stmt.bind(...columns.map(col => row[col])).run();
            }
        }
    }

    /**
     * 獲取備份列表
     * @returns {Promise<array>} 備份列表
     */
    async getBackupList() {
        try {
            const stmt = this.db.prepare(`
                SELECT backup_key, timestamp, table_count, total_rows, status
                FROM backup_history
                ORDER BY timestamp DESC
                LIMIT 50
            `);
            const { results } = await stmt.all();
            return results;
        } catch (error) {
            console.error('[BackupService] Failed to get backup list:', error);
            return [];
        }
    }

    /**
     * 清理過期備份
     * @param {number} daysToKeep 保留天數
     * @returns {Promise<object>} 清理結果
     */
    async cleanupOldBackups(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const stmt = this.db.prepare(`
                SELECT backup_key FROM backup_history
                WHERE timestamp < ? AND status = 'completed'
            `);
            const { results } = await stmt.bind(cutoffDate.toISOString()).all();
            
            let deletedCount = 0;
            for (const row of results) {
                try {
                    await this.env.BACKUP_KV.delete(row.backup_key);
                    await this.db.prepare(`
                        DELETE FROM backup_history WHERE backup_key = ?
                    `).bind(row.backup_key).run();
                    deletedCount++;
                } catch (error) {
                    console.error(`[BackupService] Failed to delete backup ${row.backup_key}:`, error);
                }
            }
            
            return {
                success: true,
                deletedCount,
                totalFound: results.length
            };
        } catch (error) {
            console.error('[BackupService] Cleanup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 檢查備份健康狀態
     * @returns {Promise<object>} 健康狀態
     */
    async checkBackupHealth() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    COUNT(*) as total_backups,
                    MAX(timestamp) as last_backup,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_backups,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_backups
                FROM backup_history
                WHERE timestamp > datetime('now', '-7 days')
            `);
            const health = await stmt.first();
            
            const lastBackupDate = health.last_backup ? new Date(health.last_backup) : null;
            const daysSinceLastBackup = lastBackupDate ? 
                (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24) : Infinity;
            
            return {
                healthy: daysSinceLastBackup <= 1 && health.failed_backups === 0,
                lastBackup: health.last_backup,
                daysSinceLastBackup: Math.floor(daysSinceLastBackup),
                weeklyStats: {
                    total: health.total_backups,
                    successful: health.successful_backups,
                    failed: health.failed_backups
                },
                recommendations: this.getHealthRecommendations(health, daysSinceLastBackup)
            };
        } catch (error) {
            console.error('[BackupService] Health check failed:', error);
            return {
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * 獲取健康檢查建議
     */
    getHealthRecommendations(health, daysSinceLastBackup) {
        const recommendations = [];
        
        if (daysSinceLastBackup > 1) {
            recommendations.push('建議立即執行備份');
        }
        
        if (health.failed_backups > 0) {
            recommendations.push('發現失敗的備份，建議檢查錯誤日誌');
        }
        
        if (health.total_backups === 0) {
            recommendations.push('過去7天沒有備份記錄，建議檢查備份排程');
        }
        
        return recommendations;
    }
} 