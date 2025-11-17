import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/SideBar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DashboardLayoutProps {
  pageTitle: string;
  breadcrumbs?: Breadcrumb[];
  children: React.ReactNode;
}

export function DashboardLayout({ pageTitle, breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }], children }: DashboardLayoutProps) {
  // Le dernier breadcrumb est toujours la page actuelle
  const currentPage = pageTitle || breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';
  const previousBreadcrumbs = breadcrumbs.slice(0, -1);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {previousBreadcrumbs.map((breadcrumb, index) => (
                <>
                  <BreadcrumbItem key={`item-${index}`} className="hidden md:block">
                    {breadcrumb.href ? (
                      <BreadcrumbLink href={breadcrumb.href}>
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <span>{breadcrumb.label}</span>
                    )}
                  </BreadcrumbItem>
                  <BreadcrumbSeparator key={`sep-${index}`} className="hidden md:block" />
                </>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

