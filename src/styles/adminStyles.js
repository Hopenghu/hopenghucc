export function getAdminStyles() {
  return `
    .admin-container {
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: 100vh;
    }

    .admin-sidebar {
      background-color: var(--background-color);
      border-right: 1px solid var(--border-color);
      padding: 1rem;
    }

    .admin-content {
      padding: 2rem;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .admin-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--text-color);
    }

    .admin-menu {
      list-style: none;
      margin-top: 2rem;
    }

    .admin-menu-item {
      margin-bottom: 0.5rem;
    }

    .admin-menu-link {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      color: var(--text-color);
      text-decoration: none;
      border-radius: 0.25rem;
      transition: background-color 0.3s ease;
    }

    .admin-menu-link:hover {
      background-color: var(--primary-light);
      color: white;
    }

    .admin-menu-link.active {
      background-color: var(--primary-color);
      color: white;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .admin-table th,
    .admin-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .admin-table th {
      font-weight: 600;
      background-color: var(--background-color);
    }

    .admin-form {
      max-width: 600px;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 0.25rem;
      background-color: var(--background-color);
      color: var(--text-color);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .admin-actions {
      display: flex;
      gap: 0.5rem;
    }

    .admin-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.25rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .admin-button-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .admin-button-danger {
      background-color: var(--accent-color);
      color: white;
    }

    @media (max-width: 768px) {
      .admin-container {
        grid-template-columns: 1fr;
      }

      .admin-sidebar {
        display: none;
      }

      .admin-sidebar.active {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
      }
    }
  `;
} 