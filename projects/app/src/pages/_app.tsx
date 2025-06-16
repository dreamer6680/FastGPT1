import type { AppProps } from 'next/app';
import Script from 'next/script';

import Layout from '@/components/Layout';
import { appWithTranslation } from 'next-i18next';

import QueryClientContext from '@/web/context/QueryClient';
import ChakraUIContext from '@/web/context/ChakraUI';
import { useInitApp } from '@/web/context/useInitApp';
import { useTranslation } from 'next-i18next';
import '@/web/styles/reset.scss';
import NextHead from '@/components/common/NextHead';
import { type ReactElement, useEffect, useRef } from 'react';
import { type NextPage } from 'next';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import SystemStoreContextProvider from '@fastgpt/web/context/useSystem';
import { useRouter } from 'next/router';
import { loginOut } from '@/web/support/user/api';

type NextPageWithLayout = NextPage & {
  setLayout?: (page: ReactElement) => JSX.Element;
};
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// 哪些路由有自定义 Head
const routesWithCustomHead = [
  '/chat',
  '/chat/share',
  'chat/team',
  '/app/detail/',
  '/dataset/detail'
];

function App({ Component, pageProps }: AppPropsWithLayout) {
  const { feConfigs, scripts, title } = useInitApp();
  const { t } = useTranslation();

  // Forbid touch scale
  useEffect(() => {
    document.addEventListener(
      'wheel',
      function (e) {
        if (e.ctrlKey && Math.abs(e.deltaY) !== 0) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }, []);

  const setLayout = Component.setLayout || ((page) => <>{page}</>);

  const router = useRouter();
  const showHead = !router?.pathname || !routesWithCustomHead.includes(router.pathname);

  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30分钟
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resetTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      handleIdle();
    }, IDLE_TIMEOUT);
  };

  const handleIdle = () => {
    loginOut().then(() => {
      router.replace('/login');
    });
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // 初始化计时器

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetTimer]);

  return (
    <>
      {showHead && (
        <NextHead
          title={title}
          desc={
            feConfigs?.systemDescription ||
            process.env.SYSTEM_DESCRIPTION ||
            `${title}${t('app:intro')}`
          }
          icon={getWebReqUrl(feConfigs?.favicon || process.env.SYSTEM_FAVICON)}
        />
      )}

      {scripts?.map((item, i) => <Script key={i} strategy="lazyOnload" {...item}></Script>)}

      <QueryClientContext>
        <SystemStoreContextProvider device={pageProps.deviceSize}>
          <ChakraUIContext>
            <Layout>{setLayout(<Component {...pageProps} />)}</Layout>
          </ChakraUIContext>
        </SystemStoreContextProvider>
      </QueryClientContext>
    </>
  );
}

// @ts-ignore
export default appWithTranslation(App);
