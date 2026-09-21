import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { publicAsset } from "@/lib/utils";
import appCss from "../styles.css?url";

const APP_NAME = "Withered Dex";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#3E250C" },
      {
        name: "description",
        content: "Monster avatar cards and synthesis family trees.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: publicAsset("favicon.svg") },
      { rel: "stylesheet", href: appCss },
      { rel: "apple-touch-icon", href: publicAsset("__grok/icon-180.png") },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
