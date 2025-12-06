/// <reference types="cypress" />
import Toast, { type ToastState } from '../../src/app/components/Toast';

describe('Toast Component', () => {
  let onDismissStub: Cypress.Agent<sinon.SinonStub>;
  let onAnimationEndStub: Cypress.Agent<sinon.SinonStub>;

  beforeEach(() => {
    // Create fresh stubs for each test
    onDismissStub = cy.stub().as('onDismiss');
    onAnimationEndStub = cy.stub().as('onAnimationEnd');
  });

  describe('Rendering', () => {
    it('should render success toast', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'success',
        message: 'Operation successful!',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('exist');
      cy.get('[data-cy="toast"], .toast').should('have.class', 'toast--success');
      cy.contains('Operation successful!').should('be.visible');
      cy.get('[data-cy="toast-close"], .toast-close').should('exist');
    });

    it('should render error toast with icon', () => {
      const toast: ToastState = {
        id: 2,
        tone: 'error',
        message: 'An error occurred',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('exist');
      cy.get('[data-cy="toast"], .toast').should('have.class', 'toast--error');
      cy.contains('An error occurred').should('be.visible');
      cy.get('[data-cy="toast-icon"], .toast-icon').should('exist').and('contain', '⚠');
      cy.get('[data-cy="toast-close"], .toast-close').should('exist');
    });

    it('should render loading toast with spinner', () => {
      const toast: ToastState = {
        id: 3,
        tone: 'loading',
        message: 'Loading...',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('exist');
      cy.get('[data-cy="toast"], .toast').should('have.class', 'toast--loading');
      cy.contains('Loading...').should('be.visible');
      cy.get('[data-cy="toast-spinner"], .toast-spinner').should('exist');
      // Loading toast should not have close button
      cy.get('[data-cy="toast-close"], .toast-close').should('not.exist');
    });

    it('should not render when toast is null', () => {
      cy.mount(
        <Toast 
          toast={null} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('not.exist');
    });
  });

  describe('Interactions', () => {
    it('should call onDismiss when close button is clicked', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'success',
        message: 'Test message',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast-close"], .toast-close').should('exist').click();
      cy.get('@onDismiss').should('have.been.calledOnce');
    });

    it('should call onAnimationEnd when animation completes', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'success',
        message: 'Test message',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('exist');
      // Trigger animation end event
      cy.get('[data-cy="toast"], .toast').trigger('animationend');
      
      cy.get('@onAnimationEnd').should('have.been.called');
    });
  });

  describe('Dismissal State', () => {
    it('should apply dismissing class when isDismissing is true', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'success',
        message: 'Test message',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={true} 
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('have.class', 'toast--dismissing');
    });

    it('should not apply dismissing class when isDismissing is false', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'success',
        message: 'Test message',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('not.have.class', 'toast--dismissing');
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" for screen readers', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'error',
        message: 'Error message',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast"], .toast').should('have.attr', 'role', 'alert');
    });

    it('should have aria-label on close button', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'success',
        message: 'Success message',
      };

      cy.mount(
        <Toast 
          toast={toast} 
          isDismissing={false}
          onDismiss={onDismissStub}
          onAnimationEnd={onAnimationEndStub}
        />
      );
      
      cy.get('[data-cy="toast-close"], .toast-close').should('have.attr', 'aria-label', 'Dismiss');
    });
  });

  describe('Different Toast Tones', () => {
    it('should render with correct styling for each tone', () => {
      const tones: Array<ToastState['tone']> = ['success', 'error', 'loading'];
      
      tones.forEach((tone) => {
        const toast: ToastState = {
          id: Date.now(),
          tone,
          message: `${tone} message`,
        };

        cy.mount(
          <Toast 
            toast={toast} 
            isDismissing={false}
            onDismiss={onDismissStub}
            onAnimationEnd={onAnimationEndStub}
          />
        );
        
        cy.get('[data-cy="toast"], .toast').should('have.class', `toast--${tone}`);
        cy.contains(`${tone} message`).should('be.visible');
      });
    });
  });

  describe('Portal Rendering', () => {
    it('should render toast in document.body via portal', () => {
      const toast: ToastState = {
        id: 1,
        tone: 'success',
        message: 'Portal test',
      };

      cy.mount(
        <div data-cy="test-container">
          <Toast 
            toast={toast} 
            isDismissing={false}
            onDismiss={onDismissStub}
            onAnimationEnd={onAnimationEndStub}
          />
        </div>
      );
      
      // Toast should exist in body, not in test container
      cy.get('body').find('[data-cy="toast"], .toast').should('exist');
      cy.get('[data-cy="test-container"]').find('[data-cy="toast"], .toast').should('not.exist');
    });
  });
});

