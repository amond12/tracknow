import { Link } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type QueryValue = string | number | boolean | null | undefined;

interface PaginationNavProps<T> {
    path: string;
    pagination: Paginated<T>;
    query?: Record<string, QueryValue>;
}

function buildHref(
    path: string,
    query: Record<string, QueryValue>,
    page: number,
): string {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;

        params.set(key, String(value));
    });

    if (page > 1) {
        params.set('page', String(page));
    }

    const search = params.toString();

    return search ? `${path}?${search}` : path;
}

function getVisiblePages(currentPage: number, lastPage: number) {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, 'ellipsis-right', lastPage] as const;
    }

    if (currentPage >= lastPage - 3) {
        return [
            1,
            'ellipsis-left',
            lastPage - 4,
            lastPage - 3,
            lastPage - 2,
            lastPage - 1,
            lastPage,
        ] as const;
    }

    return [
        1,
        'ellipsis-left',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        'ellipsis-right',
        lastPage,
    ] as const;
}

function PaginationButton({
    href,
    active = false,
    disabled = false,
    className,
    children,
}: {
    href?: string;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    children: ReactNode;
}) {
    const classes = cn(
        'h-8 min-w-8 rounded-lg px-2.5',
        active &&
            'border-primary/25 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
        className,
    );

    if (active) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className={classes}
                aria-current="page"
            >
                {children}
            </Button>
        );
    }

    if (!href || disabled) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                className={classes}
            >
                {children}
            </Button>
        );
    }

    return (
        <Button asChild type="button" variant="outline" size="sm" className={classes}>
            <Link href={href} preserveScroll>
                {children}
            </Link>
        </Button>
    );
}

export function PaginationNav<T>({
    path,
    pagination,
    query = {},
}: PaginationNavProps<T>) {
    if (pagination.last_page <= 1) {
        return null;
    }

    const currentPage = pagination.current_page;
    const lastPage = pagination.last_page;
    const visiblePages = getVisiblePages(currentPage, lastPage);

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
                Mostrando {pagination.from ?? 0}-{pagination.to ?? 0} de{' '}
                {pagination.total}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
                <PaginationButton
                    href={
                        currentPage > 1
                            ? buildHref(path, query, 1)
                            : undefined
                    }
                    disabled={currentPage === 1}
                    className="px-2"
                >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                </PaginationButton>

                <PaginationButton
                    href={
                        pagination.prev_page_url
                            ? buildHref(path, query, currentPage - 1)
                            : undefined
                    }
                    disabled={!pagination.prev_page_url}
                    className="gap-1.5 px-2.5"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Anterior</span>
                </PaginationButton>

                {visiblePages.map((page) =>
                    typeof page === 'number' ? (
                        <PaginationButton
                            key={page}
                            href={buildHref(path, query, page)}
                            active={page === currentPage}
                            disabled={page === currentPage}
                        >
                            {page}
                        </PaginationButton>
                    ) : (
                        <span
                            key={page}
                            className="inline-flex h-8 min-w-8 items-center justify-center text-muted-foreground"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </span>
                    ),
                )}

                <PaginationButton
                    href={
                        pagination.next_page_url
                            ? buildHref(path, query, currentPage + 1)
                            : undefined
                    }
                    disabled={!pagination.next_page_url}
                    className="gap-1.5 px-2.5"
                >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                </PaginationButton>

                <PaginationButton
                    href={
                        currentPage < lastPage
                            ? buildHref(path, query, lastPage)
                            : undefined
                    }
                    disabled={currentPage === lastPage}
                    className="px-2"
                >
                    <ChevronsRight className="h-3.5 w-3.5" />
                </PaginationButton>
            </div>
        </div>
    );
}
