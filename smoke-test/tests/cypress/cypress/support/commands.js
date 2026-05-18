Cypress.Commands.add(
  "removeDomainFromDataset",
  (urn, dataset_name, domain_urn) => {
    cy.goToDataset(urn, dataset_name);
    cy.get(`.sidebar-domain-section [href="/domain/${domain_urn}"]`, {
      timeout: 30000,
    }).should("be.visible");
    cy.get(
      `.sidebar-domain-section [href="/domain/${domain_urn}"] .anticon-close`,
      { timeout: 30000 },
    )
      .should("be.visible")
      .click();
    cy.clickOptionWithText("Yes");
    cy.get(`.sidebar-domain-section [href="/domain/${domain_urn}"]`, {
      timeout: 30000,
    }).should("not.exist");
  },
);
