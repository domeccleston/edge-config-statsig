import type { AppProps } from "next/app";
import { StatsigProvider } from "statsig-react";
import Cookies from "js-cookie";
import type { LayoutProps } from "@vercel/examples-ui/layout";
import { getLayout } from "@vercel/examples-ui";
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
  // Middleware will automatically set a cookie for the user if they visit a page
  const Layout = getLayout<LayoutProps>(Component);

  return (
    <Layout
      title="Experimentation with Statsig"
      description="How to do experimentation with Statsig"
      path="edge-middleware/ab-testing-statsig"
    >
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
