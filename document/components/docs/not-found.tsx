'use client';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const exactMap: Record<string, string> = {
  '/docs/intro': '/docs/introduction',
  '/docs/guide/dashboard/workflow/coreferenceresolution':
    '/docs/introduction/guide/dashboard/workflow/coreferenceResolution',
  '/docs/guide/admin/sso_dingtalk':
    '/docs/introduction/guide/admin/sso#/docs/introduction/guide/admin/sso#钉钉',
  '/docs/guide/knowledge_base/rag': '/docs/introduction/guide/knowledge_base/RAG',
  '/docs/commercial/intro/': '/docs/introduction'
};

const exactMap2: Record<string, string> = {
  "/docs/api": "/docs/api/api1",
  "/docs/introduction": "/docs/introduction/index",
  "/docs/introduction/FAQ": "/docs/introduction/FAQ/docker",
  "/docs/introduction/development": "/docs/introduction/development/intro",
  "/docs/introduction/development/custom-models": "/docs/introduction/development/custom-models/marker",
  "/docs/introduction/development/design": "/docs/introduction/development/design/dataset",
  "/docs/introduction/development/migration": "/docs/introduction/development/migration/docker_db",
  "/docs/introduction/development/modelConfig": "/docs/introduction/development/modelConfig/ai-proxy",
  "/docs/introduction/development/openapi": "/docs/introduction/development/openapi/intro",
  "/docs/introduction/development/proxy": "/docs/introduction/development/proxy/nginx",
  "/docs/introduction/development/upgrading": "/docs/introduction/development/upgrading/intro",
  "/docs/introduction/guide": "/docs/introduction/guide/course/quick-start",
  "/docs/introduction/guide/DialogBoxes": "/docs/introduction/guide/DialogBoxes/htmlRendering",
  "/docs/introduction/guide/admin": "/docs/introduction/guide/admin/sso",
  "/docs/introduction/guide/course": "/docs/introduction/guide/course/quick-start",
  "/docs/introduction/guide/dashboard": "/docs/introduction/guide/dashboard/basic-mode",
  "/docs/introduction/guide/dashboard/workflow": "/docs/introduction/guide/dashboard/workflow/ai_chat",
  "/docs/introduction/guide/knowledge_base": "/docs/introduction/guide/knowledge_base/RAG",
  "/docs/introduction/guide/plugins": "/docs/introduction/guide/plugins/dev_system_tool",
  "/docs/introduction/guide/team_permissions": "/docs/introduction/guide/team_permissions/team_roles_permissions",
  "/docs/introduction/shopping_cart": "/docs/introduction/shopping_cart/saas",
  "/docs/protocol": "/docs/protocol/open-source",
  "/docs/use-cases": "/docs/use-cases/external-integration/openapi",
  "/docs/use-cases/app-cases": "/docs/use-cases/app-cases/submit_application_template",
  "/docs/use-cases/external-integration": "/docs/use-cases/external-integration/openapi"
};

const prefixMap: Record<string, string> = {
  '/docs/development': '/docs/introduction/development',
  '/docs/FAQ': '/docs/introduction/FAQ',
  '/docs/guide': '/docs/introduction/guide',
  '/docs/shopping_cart': '/docs/introduction/shopping_cart',
  '/docs/agreement': '/docs/protocol'
};

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    if (exactMap[pathname]) {
      redirect(exactMap[pathname]);
      return;
    }

    if (exactMap2[pathname]) {
      redirect(exactMap2[pathname]);
      return;
    }

    for (const [oldPrefix, newPrefix] of Object.entries(prefixMap)) {
      if (pathname.startsWith(oldPrefix)) {
        const rest = pathname.slice(oldPrefix.length);
        redirect(newPrefix + rest);
        return;
      }
    }

    redirect('/docs/introduction');
  }, [pathname]);

  return <></>;
}
