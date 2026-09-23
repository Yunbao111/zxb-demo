import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "欧律通 · 欧洲贸易法规工作台",
  description: "检索欧盟法规原文，沿引用追溯关联法条。比赛研究演示版，明确展示来源及版本范围。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
