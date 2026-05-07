describe('Happy Path: Login and Attendance', () => {
  beforeEach(() => {
    // Clear cookies/localStorage to start fresh
    cy.clearCookies();
    cy.clearLocalStorage();

    // Mock Authentication
    cy.intercept('POST', '**/web/session/authenticate', {
      body: {
        result: {
          uid: 1,
          username: 'vibol.khan@axivit.com',
          name: 'Vibol Khan'
        }
      }
    }).as('loginRequest');

    // Mock User Data
    cy.intercept('POST', '**/web/dataset/call_kw/res.users/read', {
      body: {
        result: [{ id: 1, name: 'Vibol Khan', login: 'vibol.khan@axivit.com' }]
      }
    }).as('userRead');

    // Mock Leave Allocations
    cy.intercept('POST', '**/web/dataset/call_kw/hr.leave.allocation/web_search_read', {
      body: {
        result: {
          records: [
            { 
              id: 1, 
              holiday_status_id: { display_name: 'Annual Leave' }, 
              number_of_days: 10, 
              state: 'validate' 
            }
          ]
        }
      }
    }).as('leaveAllocations');

    // Mock Leave Requests
    cy.intercept('POST', '**/web/dataset/call_kw/hr.leave/web_search_read', {
      body: {
        result: {
          records: []
        }
      }
    }).as('leaveRequests');
  });

  it('should allow a user to login and see their profile', () => {
    cy.visit('/login');

    cy.get('h1').should('contain', 'Welcome Back');

    cy.get('input[type="email"]').clear().type('vibol.khan@axivit.com');
    cy.get('input[type="password"]').clear().type('Admin@2026');

    cy.get('ion-button.submit-button').click();
    cy.wait('@loginRequest');

    // Should redirect to dashboard/tabs
    cy.url().should('include', '/tabs/leave-calendar');
  });

  it('should navigate to leave balance and see allocations', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type('vibol.khan@axivit.com');
    cy.get('input[type="password"]').clear().type('Admin@2026');
    cy.get('ion-button.submit-button').click();
    cy.wait('@loginRequest');

    // Go to Leave Balance
    cy.visit('/tabs/leave-balance');
    cy.get('h1').should('contain', 'Leave Balance');

    // Wait for async state to load
    cy.get('.summary-card', { timeout: 10000 }).should('be.visible');
    cy.get('.balance-list').should('be.visible');
  });
});
