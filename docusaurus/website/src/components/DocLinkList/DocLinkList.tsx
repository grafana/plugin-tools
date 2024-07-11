import React from 'react';
import { useCurrentSidebarCategory, filterDocCardListItems } from '@docusaurus/theme-common';
import { useDocById, findFirstSidebarItemLink } from '@docusaurus/theme-common/internal';
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
      {filteredItems.map((item) => {
        if (item.type === 'link') {
          return <DocLink key={item.docId} item={item} />;
        }
        if (item.type === 'category') {
          return <DocCategoryLink key={item.href} category={item} />;
        }
      })}
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

function DocCategoryLink({ category }) {
  const categoryHref = findFirstSidebarItemLink(category);
  const doc = useDocById(category.docId ?? undefined);
  const description = category.description || category.customProps?.description || doc?.description;
  const renderSubItems = (items) => {
    return (
      <ul>
        {items.map((subItem) => {
          if (subItem.type === 'link') {
            return <DocLink key={subItem.docId} item={subItem} />;
          }
          if (subItem.type === 'category') {
            return <DocCategoryLink key={subItem.docId} category={subItem} />;
          }
        })}
      </ul>
    );
  };

  return (
    <li key={category.docId} className="margin-bottom--md">
      <Link to={categoryHref}>{category.label}</Link>
      {description && <small className={styles.description}>{description}</small>}
      {category.items && renderSubItems(category.items)}
    </li>
  );
}
