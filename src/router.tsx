import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

/** Subpath when Vite `base` is not `/` (GitHub Pages project site). */
function routerBasepath(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/") return undefined;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return trimmed === "" ? undefined : trimmed;
}

export function getRouter() {
  return createRouter({
    routeTree,
    basepath: routerBasepath(),
    defaultErrorComponent: AppErrorComponent,
  });
}
