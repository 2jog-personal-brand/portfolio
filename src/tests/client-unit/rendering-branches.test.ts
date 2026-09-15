import assert from "node:assert/strict";
import { test } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";

Object.assign(globalThis, { React });

const [
  { ActivityToggle },
  { BlueprintCard },
  { default: BusinessCard },
  { default: Footer },
  { default: PortfolioPage },
  { default: ThreeDCard },
  { Button },
] = await Promise.all([
  import("../../client/src/components/ActivityToggle"),
  import("../../client/src/components/BlueprintCard"),
  import("../../client/src/components/BusinessCard"),
  import("../../client/src/components/Footer"),
  import("../../client/src/pages/Portfolio"),
  import("../../client/src/components/ThreeDCard"),
  import("../../client/src/components/ui/button"),
]);

function renderWithClient(client: QueryClient, element: React.ReactElement): string {
  return renderToStaticMarkup(React.createElement(
    QueryClientProvider,
    { client },
    React.createElement(Router, { ssrPath: "/portfolio" }, element),
  ));
}

test("button and activity toggle render both structural branches", () => {
  const button = renderToStaticMarkup(React.createElement(Button, null, "Save"));
  assert.match(button, /^<button/);

  const child = renderToStaticMarkup(React.createElement(
    Button,
    { asChild: true },
    React.createElement("a", { href: "/portfolio" }, "Portfolio"),
  ));
  assert.match(child, /^<a/);
  assert.match(child, /href="\/portfolio"/);

  for (const activeTab of ["github", "linkedin"] as const) {
    const toggle = renderToStaticMarkup(React.createElement(ActivityToggle, {
      activeTab,
      onChange: () => undefined,
    }));
    assert.match(toggle, new RegExp(`data-active-tab="${activeTab}"`));
    assert.match(toggle, /activity-tab-github/);
    assert.match(toggle, /activity-tab-linkedin/);
  }
});

test("blueprint cards render fallback, explicit, active, inactive, and link projections", () => {
  const active = renderToStaticMarkup(React.createElement(BlueprintCard, {
    title: "Example Project",
    description: "A tested project",
    tech: ["TypeScript"],
    activeCardId: "card-Example-Project",
  }));
  assert.match(active, /data-active="true"/);
  assert.doesNotMatch(active, /aria-label="(?:GitHub repository|Live site)"/);

  const linked = renderToStaticMarkup(React.createElement(BlueprintCard, {
    id: "explicit-card",
    title: "Linked Project",
    description: "Both links are configured",
    tech: ["React"],
    className: "coverage-card",
    activeCardId: "explicit-card",
    isActiveFace: false,
    githubUrl: "https://github.com/example/project",
    deployedUrl: "https://example.test",
  }));
  assert.match(linked, /data-active="false"/);
  assert.match(linked, /coverage-card/);
  assert.match(linked, /aria-label="GitHub repository"/);
  assert.match(linked, /aria-label="Live site"/);

  const githubOnly = renderToStaticMarkup(React.createElement(BlueprintCard, {
    title: "Repository Only",
    description: "Only source is configured",
    tech: [],
    githubUrl: "https://github.com/example/source",
  }));
  assert.match(githubOnly, /aria-label="GitHub repository"/);
  assert.doesNotMatch(githubOnly, /aria-label="Live site"/);

  const deployedOnly = renderToStaticMarkup(React.createElement(BlueprintCard, {
    title: "Deployment Only",
    description: "Only a deployment is configured",
    tech: [],
    deployedUrl: "https://deployment.example.test",
  }));
  assert.doesNotMatch(deployedOnly, /aria-label="GitHub repository"/);
  assert.match(deployedOnly, /aria-label="Live site"/);
});

test("three-dimensional cards render enabled defaults and disabled visual effects", () => {
  const defaults = renderToStaticMarkup(React.createElement(
    ThreeDCard,
    null,
    React.createElement("span", null, "Default card"),
  ));
  assert.match(defaults, /Default card/);
  assert.match(defaults, /box-shadow/);
  assert.match(defaults, /radial-gradient/);
  assert.match(defaults, /translateZ\(40px\)/);

  const reducedMotion = renderToStaticMarkup(React.createElement(
    ThreeDCard,
    {
      backgroundImage: "/assets/card-background.png",
      className: "outer-card",
      roundedClass: "rounded-none",
      enableGlow: false,
      enableShadow: false,
      enableParallax: false,
      isFlipped: true,
      transitionDuration: "0s",
    },
    React.createElement("span", null, "Reduced effects"),
  ));
  assert.match(reducedMotion, /Reduced effects/);
  assert.match(reducedMotion, /outer-card/);
  assert.match(reducedMotion, /background-image:url\(\/assets\/card-background\.png\)/);
  assert.match(reducedMotion, /box-shadow:none/);
  assert.doesNotMatch(reducedMotion, /radial-gradient/);
  assert.doesNotMatch(reducedMotion, /translateZ/);
  assert.match(reducedMotion, /rotateY\(180deg\)/);
});

test("business card and footer render configured and explicit empty states", () => {
  const emptyClient = new QueryClient({
    defaultOptions: { queries: { queryFn: async () => null, retry: false } },
  });
  const emptyCard = renderWithClient(emptyClient, React.createElement(BusinessCard));
  const emptyFooter = renderWithClient(emptyClient, React.createElement(Footer));
  assert.match(emptyCard, /Personal information is not configured/);
  assert.match(emptyCard, /Contact details are not configured/);
  assert.match(emptyCard, /Loading summary/);
  assert.match(emptyFooter, /Personal information is not configured/);
  assert.match(emptyFooter, /Portfolio owner not configured/);

  const configuredClient = new QueryClient({
    defaultOptions: { queries: { queryFn: async () => null, retry: false } },
  });
  configuredClient.setQueryData(["/api/public/personal-information"], {
    name: "Example Engineer",
    title: "Platform Engineer",
    location: "Remote",
    shortBio: "Builds reliable systems",
    email: "engineer@example.test",
    phone: "+15551234567",
    phoneFormatted: "+1 555 123 4567",
    linkedinUrl: "https://linkedin.example.test/engineer",
    githubUrl: "https://github.com/example-engineer",
    devpostUrl: "https://devpost.example.test/engineer",
    portfolioUrl: "https://portfolio.example.test/",
  });
  configuredClient.setQueryData(["/api/public/bio"], {
    id: "bio",
    headline: "Reliable systems",
    paragraphs: [
      { id: "first", bioId: "bio", content: "First paragraph.", position: 0 },
      { id: "second", bioId: "bio", content: "Second paragraph.", position: 1 },
    ],
  });

  const configuredCard = renderWithClient(
    configuredClient,
    React.createElement(BusinessCard, { isOpen: true }),
  );
  const configuredFooter = renderWithClient(configuredClient, React.createElement(Footer));
  assert.match(configuredCard, /Example Engineer/);
  assert.match(configuredCard, /First paragraph/);
  assert.match(configuredCard, /Second paragraph/);
  assert.match(configuredCard, /href="tel:\+15551234567"/);
  assert.match(configuredCard, />portfolio\.example\.test</);
  assert.match(configuredFooter, /mailto:engineer@example\.test/);
  assert.match(configuredFooter, /Example Engineer/);
});

test("portfolio page renders empty, populated, active, inactive, and placeholder faces", () => {
  const emptyClient = new QueryClient({
    defaultOptions: { queries: { queryFn: async () => null, retry: false } },
  });
  emptyClient.setQueryData(["/api/public/projects"], null);
  emptyClient.setQueryData(["/api/public/personal-information"], null);
  const empty = renderWithClient(emptyClient, React.createElement(PortfolioPage));
  assert.match(empty, /data-testid="portfolio-empty"/);
  assert.match(empty, /0 found/);

  const projects = Array.from({ length: 5 }, (_, index) => ({
    id: `project-${index + 1}`,
    title: `Project ${index + 1}`,
    description: `Description ${index + 1}`,
    tech: index % 2 === 0 ? ["TypeScript"] : [],
    githubUrl: index === 0 ? "https://github.com/example/project" : null,
    deployedUrl: index === 1 ? "https://project.example.test" : null,
  }));
  const populatedClient = new QueryClient({
    defaultOptions: { queries: { queryFn: async () => null, retry: false } },
  });
  populatedClient.setQueryData(["/api/public/projects"], projects);
  populatedClient.setQueryData(["/api/public/personal-information"], null);
  const populated = renderWithClient(populatedClient, React.createElement(PortfolioPage));
  assert.match(populated, /data-testid="portfolio-cube"/);
  assert.match(populated, /5 found/);
  assert.match(populated, /Project 1/);
  assert.match(populated, /project-card--inactive/);
  assert.match(populated, /project-card-placeholder/);
  assert.match(populated, /data-chalk-hint="card"/);
});
