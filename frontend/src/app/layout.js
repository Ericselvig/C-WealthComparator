import localFont from "next/font/local";
import "./globals.css";
import { Web3Provider } from "@/provider/web3-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "React Startker Kit | inco/js",
  description: "Starter kit for React with inco/js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
            <div>{children}</div>
        </Web3Provider>
      </body>
    </html>
  );
}
