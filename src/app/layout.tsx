import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {QuizProvider} from "@/components/session-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz Central",
  description: "Quiz creation web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QuizProvider>
          {children}
        </QuizProvider>  
      </body>
    </html>
  );
}

