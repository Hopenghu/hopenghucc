/**
 * ServiceFactory - 服務工廠類
 * 統一管理所有服務的實例化和依賴注入
 * 遵循依賴注入和單例模式的最佳實踐
 */
import { AuthService } from './AuthService.js';
import { UserService } from './UserService.js';
import { SessionService } from './SessionService.js';
import { GoogleAuthService } from './GoogleAuthService.js';
import { LocationService } from './locationService.js';
import { LocationInvitationService } from './LocationInvitationService.js';
import { AIService } from './AIService.js';
import { BusinessVerificationService } from './BusinessVerificationService.js';
import { ItineraryService } from './ItineraryService.js';
import { RecommendationService } from './RecommendationService.js';
import { SearchService } from './SearchService.js';
import { FavoritesService } from './FavoritesService.js';
import { SecurityService } from './SecurityService.js';
import { RateLimitService } from './RateLimitService.js';
import { AIAgentFactory } from './AIAgentFactory.js';
import { EcosystemService } from './EcosystemService.js';

/**
 * 服務工廠類
 * 負責創建和管理所有服務實例
 */
export class ServiceFactory {
  /**
   * 創建服務工廠實例
   * @param {Object} env - 環境變數對象
   * @param {Object} options - 可選配置
   */
  constructor(env, options = {}) {
    if (!env || !env.DB) {
      throw new Error('Environment with DB connection is required for ServiceFactory');
    }
    
    this.env = env;
    this.options = {
      enableLogging: options.enableLogging ?? true,
      enableCaching: options.enableCaching ?? true,
      ...options
    };
    
    // 服務實例緩存（單例模式）
    this._services = new Map();
  }

  /**
   * 獲取或創建服務實例（單例模式）
   * @param {string} serviceName - 服務名稱
   * @returns {Object} 服務實例
   */
  getService(serviceName) {
    if (this._services.has(serviceName)) {
      return this._services.get(serviceName);
    }
    
    const service = this._createService(serviceName);
    this._services.set(serviceName, service);
    return service;
  }

  /**
   * 創建服務實例
   * @param {string} serviceName - 服務名稱
   * @returns {Object} 服務實例
   * @private
   */
  _createService(serviceName) {
    const { env, options } = this;
    
    if (options.enableLogging) {
      console.log(`[ServiceFactory] Creating service: ${serviceName}`);
    }

    try {
      switch (serviceName) {
        case 'userService':
          return new UserService(env.DB);
        
        case 'sessionService':
          return new SessionService(env.DB);
        
        case 'googleAuthService':
          return new GoogleAuthService(env);
        
        case 'locationService':
          if (!env.GOOGLE_MAPS_API_KEY) {
            throw new Error('GOOGLE_MAPS_API_KEY is required for LocationService');
          }
          return new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
        
        case 'locationInvitationService':
          return new LocationInvitationService(env.DB);
        
        case 'businessVerificationService':
          return new BusinessVerificationService(env.DB);
        
        case 'aiService':
          if (!env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required for AIService');
          }
          const locationService = this.getService('locationService');
          return new AIService(
            env.DB,
            env.OPENAI_API_KEY,
            env.GEMINI_API_KEY,
            locationService,
            env.GOOGLE_MAPS_API_KEY
          );
        
        case 'authService':
          return new AuthService(
            this.getService('userService'),
            this.getService('sessionService'),
            this.getService('googleAuthService')
          );
        
        case 'itineraryService':
          return new ItineraryService(
            env.DB,
            this.getService('locationService'),
            this.getService('aiService')
          );
        
        case 'recommendationService':
          return new RecommendationService(env.DB);
        
        case 'searchService':
          return new SearchService(env.DB);
        
        case 'favoritesService':
          return new FavoritesService(env.DB);
        
        case 'securityService':
          return new SecurityService(env.DB);
        
        case 'rateLimitService':
          return new RateLimitService(env.DB);
        
        case 'aiAgentFactory':
          // AIAgentFactory 需要 ServiceFactory 本身（循環依賴，但可以處理）
          return new AIAgentFactory(this, options);
        
        case 'ecosystemService':
          return new EcosystemService(env.DB, options);
        
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }
    } catch (error) {
      console.error(`[ServiceFactory] Error creating service ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * 初始化核心服務（用於快速啟動）
   * @returns {Object} 核心服務對象
   */
  initializeCoreServices() {
    return {
      userService: this.getService('userService'),
      sessionService: this.getService('sessionService'),
      googleAuthService: this.getService('googleAuthService'),
      locationService: this.getService('locationService'),
      locationInvitationService: this.getService('locationInvitationService'),
      businessVerificationService: this.getService('businessVerificationService'),
      authService: this.getService('authService')
    };
  }

  /**
   * 初始化所有服務（用於完整功能）
   * @returns {Object} 所有服務對象
   */
  initializeAllServices() {
    const coreServices = this.initializeCoreServices();
    
    return {
      ...coreServices,
      aiService: this.getService('aiService'),
      itineraryService: this.getService('itineraryService'),
      recommendationService: this.getService('recommendationService'),
      searchService: this.getService('searchService'),
      favoritesService: this.getService('favoritesService'),
      securityService: this.getService('securityService'),
      rateLimitService: this.getService('rateLimitService'),
      aiAgentFactory: this.getService('aiAgentFactory'),
      ecosystemService: this.getService('ecosystemService')
    };
  }

  /**
   * 清除服務緩存（用於測試或重新初始化）
   */
  clearCache() {
    this._services.clear();
    if (this.options.enableLogging) {
      console.log('[ServiceFactory] Service cache cleared');
    }
  }

  /**
   * 獲取服務狀態（用於調試）
   * @returns {Object} 服務狀態信息
   */
  getServiceStatus() {
    return {
      initializedServices: Array.from(this._services.keys()),
      totalServices: this._services.size,
      environment: {
        hasDB: !!this.env.DB,
        hasGoogleMapsKey: !!this.env.GOOGLE_MAPS_API_KEY,
        hasOpenAIKey: !!this.env.OPENAI_API_KEY,
        hasGeminiKey: !!this.env.GEMINI_API_KEY
      }
    };
  }
}

