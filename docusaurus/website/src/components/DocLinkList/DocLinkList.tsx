import React from 'react';
import { useCurrentSidebarCategory, filterDocCardListItems } from '@docusaurus/theme-common';
import { useDocById } from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import type { Props } from '@theme/DocCardList';
import styles from './styles.module.css';

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
      {filteredItems.map((item) => item.type === 'link' && <DocLink key={item.docId} item={item} />)}
    </ul>
  );
}

function DocLink({ item }) {
  const doc = useDocById(item.docId ?? undefined);
  const description = item.description || doc?.description;
  return (
    <li key={item.docId} className="margin-bottom--md">
      <Link to={item.href}>{item.label}</Link>
      {description && <small className={styles.description}>{description}</small>}
    </li>
  );
}
