import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {QuizProvider} from "@/components/session-context";
import { UserProvider } from "@/engine/hooks/useUserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"] });

/**
 * Application-level metadata for the root layout.
 *
 * Provides default HTML metadata used by Next.js (app directory) to populate the document head.
 * This object supplies values such as the page title and description that appear in browser tabs,
 * search engine results, and social previews.
 * 
 * @public
 */
export const metadata: Metadata = {
  title: "Quiz Central",
  description: "Quiz creation web app",
};

/**
 * Root layout component for the application.
 *
 * Renders the top-level HTML structure required by Next.js and applies global
 * layout concerns such as setting the page language, applying the Inter font
 * class to the document body, and providing the Quiz context to the component tree.
 *
 * @param props.children - The React nodes to render inside the root layout. This value is readonly.
 * @returns A JSX element containing <html lang="en"> and <body> wrapping the provided children inside a QuizProvider.
 *
 * @remarks
 * - Located at /app/layout.tsx and exported as the default app layout for Next.js.
 * - The body class is derived from `inter.className`; ensure `inter` is initialized (e.g., via next/font) in this module.
 * - `QuizProvider` must be imported and supply quiz-related context to descendant components.
 *
 * @example
 * <RootLayout>
 *   <MainApp />
 * </RootLayout>
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId = {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <UserProvider>
            <QuizProvider>
              {children}
            </QuizProvider>
          </UserProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

