import { Logo } from "@/components/nav";
import type { BaseLayoutProps } from "@/layouts/shared";

export const baseOptions = (): BaseLayoutProps => {
  return {
    nav: {
      title: <Logo />,
      url: "/docs",
    },
    links: [
      {
        text: "Support",
        url: "mailto:contact@bevor.io",
        external: true,
      },
      {
        type: "button",
        text: "Dashboard",
        url: "https://app.bevor.io",
        external: true,
      },
    ],
    githubUrl: "https://github.com/Bevor-Protocol",
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: true,
    },
  };
};
