import { aliasQuery, hasOperationName } from "../utils";

const CUSTOMERS_DATASET_NAME = "customers";
const CUSTOMERS_DATASET_URN =
  "urn:li:dataset:(urn:li:dataPlatform:bigquery,cypress_project.jaffle_shop.customers,PROD)";
const CUSTOMERS_DATASET_SEARCH = "cypress_project.jaffle_shop.customers";
const CUSTOMERS_CONTAINER_URN =
  "urn:li:container:348c96555971d3f5c1ffd7dd2e7446cb";

describe("add remove domain", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/v2/graphql", (req) => {
      aliasQuery(req, "appConfig");
    });
  });

  const setDomainsFeatureFlag = (isOn) => {
    cy.intercept("POST", "/api/v2/graphql", (req) => {
      if (hasOperationName(req, "appConfig")) {
        req.alias = "gqlappConfigQuery";
        req.on("response", (res) => {
          res.body.data.appConfig.featureFlags.nestedDomainsEnabled = isOn;
          res.body.data.appConfig.featureFlags.showNavBarRedesign = true;
        });
      }
    });
  };

  const createDomain = () => {
    const domainId = `cypressdomaintest${Date.now()}${Cypress._.random(1000, 9999)}`;
    const domainName = `CypressDomainTest ${domainId}`;
    const domainUrn = `urn:li:domain:${domainId}`;

    setDomainsFeatureFlag(true);
    cy.login();
    cy.goToDomainList();
    cy.clickOptionWithTestId("domains-new-domain-button");
    cy.waitTextVisible("Create New Domain");
    cy.get('[data-testid="create-domain-name"]').click().type(domainName);
    cy.clickOptionWithText("Advanced");
    cy.get('[data-testid="create-domain-id"]').click().type(domainId);
    cy.get('[data-testid="create-domain-button"]', { timeout: 10000 })
      .should("be.enabled")
      .click();
    cy.waitTextVisible(domainName);

    return {
      domainName,
      domainUrn,
    };
  };

  const openDomain = (domainUrn, domainName) => {
    setDomainsFeatureFlag(true);
    cy.goToDomain(domainUrn);
    cy.waitTextVisible(domainName);
    cy.get('[data-testid="domain-batch-add"]', { timeout: 30000 }).should(
      "be.visible",
    );
  };

  const addCustomersToDomain = () => {
    cy.clickOptionWithTestId("domain-batch-add");
    cy.get('[data-testid="search-select-modal"]', { timeout: 30000 }).should(
      "be.visible",
    );
    cy.get('[data-testid="search-input"]')
      .filter(":visible")
      .first()
      .click()
      .clear()
      .type(CUSTOMERS_DATASET_SEARCH, { delay: 0 });
    cy.get(`[data-testid="checkbox-${CUSTOMERS_DATASET_URN}"]`, {
      timeout: 30000,
    })
      .should("be.visible")
      .click({ force: true });
    cy.get('[data-testid="search-select-modal-continue-button"]', {
      timeout: 10000,
    })
      .should("not.be.disabled")
      .click();
    cy.waitTextVisible("Added assets to Domain!");
  };

  const deleteDomain = () => {
    cy.deleteFromDropdown();
    cy.waitTextVisible("Deleted Domain!");
  };

  it("create domain", () => {
    createDomain();
  });

  it("add entities to domain", () => {
    const { domainName, domainUrn } = createDomain();

    openDomain(domainUrn, domainName);
    addCustomersToDomain();
  });

  it("remove entity from domain", () => {
    const { domainName, domainUrn } = createDomain();

    openDomain(domainUrn, domainName);
    addCustomersToDomain();
    cy.removeDomainFromDataset(
      CUSTOMERS_DATASET_URN,
      CUSTOMERS_DATASET_NAME,
      domainUrn,
    );
    openDomain(domainUrn, domainName);
    deleteDomain();
  });

  it("delete a domain and ensure dangling reference is deleted on entities", () => {
    const { domainName, domainUrn } = createDomain();

    openDomain(domainUrn, domainName);
    addCustomersToDomain();
    cy.goToDataset(CUSTOMERS_DATASET_URN, CUSTOMERS_DATASET_NAME);
    cy.get(`.sidebar-domain-section [href="/domain/${domainUrn}"]`, {
      timeout: 30000,
    }).should("be.visible");
    openDomain(domainUrn, domainName);
    deleteDomain();
    cy.goToContainer(CUSTOMERS_CONTAINER_URN);
    cy.waitTextVisible(CUSTOMERS_DATASET_NAME);
    cy.ensureTextNotPresent(domainName);
  });
});
