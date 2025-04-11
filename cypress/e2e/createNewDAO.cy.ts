describe('Create New DAO', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('it should have list and create button', () => {
    cy.contains('My DAOs');
    cy.contains('Create DAO');
  });

  it('[WIP] it should support creating a new DAO', () => {
    cy.contains('Create DAO').click();
    cy.contains('Create New DAO');
    cy.get('[data-testid="essentials-daoName"]').type('TestDAO');
  });
});
