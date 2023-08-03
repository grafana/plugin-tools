import React from 'react';
import clsx from 'clsx';
import { useCurrentSidebarCategory, filterDocCardListItems } from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import type { Props } from '@theme/DocCardList';

function DocCardListForCurrentSidebarCategory({ className }: Props) {
  const category = useCurrentSidebarCategory();
  return <DocLinkList items={category.items} className={className} />;
}

export default function DocLinkList(props: Props): JSX.Element {
  const { items, className } = props;
  if (!items) {
    return <DocCardListForCurrentSidebarCategory {...props} />;
  }
  const filteredItems = filterDocCardListItems(items);
  return (
    <ul className={className}>
      {filteredItems.map((item, index) => (
        // @ts-ignore - types appear to be broken.
        <li key={item.docId}>
          {/* @ts-ignore - types appear to be broken. */}
          <Link className="col col--6 margin-bottom--lg" to={item.href}>
            {/* @ts-ignore - types appear to be broken. */}
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
