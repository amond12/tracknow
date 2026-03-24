import type { ReactNode } from 'react';

type Props = {
    title: string;
    description?: string;
    eyebrow?: string;
    action?: ReactNode;
};

export function MobilePageHeader({
    title,
    description,
    eyebrow = 'Pantalla',
    action,
}: Props) {
    return (
        <section className="mobile-page-header-card md:hidden">
            <div className="space-y-1.5">
                <p className="mobile-page-header-card__eyebrow">{eyebrow}</p>
                <h1 className="mobile-page-header-card__title">{title}</h1>
                {description && (
                    <p className="mobile-page-header-card__description">
                        {description}
                    </p>
                )}
            </div>

            {action && <div className="mt-4">{action}</div>}
        </section>
    );
}
