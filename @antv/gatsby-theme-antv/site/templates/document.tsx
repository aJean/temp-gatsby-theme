import React, { useState } from 'react';
import { graphql, Link } from 'gatsby';
import {
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  VerticalAlignTopOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import {
  Layout as AntLayout,
  Menu,
  Tooltip,
  Affix,
  Anchor,
  BackTop,
} from 'antd';
import { groupBy } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import Drawer from 'rc-drawer';
import { useMedia } from 'react-use';
import RehypeReact from 'rehype-react';
import Swatch from '../components/Swatch';
import Article from '../components/Article';
import ReadingTime from '../components/ReadingTime';
import NavigatorBanner from '../components/NavigatorBanner';
import SEO from '../components/Seo';
import CustomTag from '../components/CustomTag';
import MdPlayground from '../components/MdPlayground';
import { usePrevAndNext } from '../hooks';
import { capitalize } from '../utils';
import styles from './markdown.module.less';

const { Link: AnchorLink } = Anchor;

enum LinkStatus {
  NONE = 'none',
  EXPAND = 'expand',
  FLOD = 'flod',
}
interface LinkAttr {
  href: string;
  title: string;
  children: any;
  status: LinkStatus;
}

const shouldBeShown = (slug: string, path: string, lang: string) => {
  if (!slug.startsWith(`/${lang}/`)) {
    return false;
  }
  const slugPieces = slug.split('/').slice(slug.split('/').indexOf('docs') + 1);
  const pathPieces = path.split('/').slice(slug.split('/').indexOf('docs') + 1);
  return slugPieces[0] === pathPieces[0];
};

const getMenuItemLocaleKey = (slug = '') => {
  const slugPieces = slug.split('/');
  const menuItemLocaleKey = slugPieces
    .slice(slugPieces.indexOf('docs') + 1)
    .filter((key) => key)
    .join('/');
  return menuItemLocaleKey;
};

const getDocument = (docs: any[], slug = '', level: number) => {
  if (slug.split('/').length !== level + 2) {
    return;
  }
  return docs.find((doc) => doc.slug === slug);
};

const getAnchorLinks = (tableOfContents: string) => {
  const reg = /<(li|p)><a href="(.+)">(.+)<\/a><\/(li|p)>/g;
  const result: LinkAttr[] = [];
  let link = reg.exec(tableOfContents);
  while (link) {
    const [, tag, href, title] = link;
    const rwaHref = decodeURIComponent(href.replace(/\/#/g, '#'));
    const linkAttr = {
      href: rwaHref,
      title,
    };
    if (tag === 'p') {
      result.push({
        ...linkAttr,
        children: [],
        status: LinkStatus.EXPAND,
      });
    } else if (tag === 'li') {
      const len = result.length;
      if (len && result[len - 1].children) {
        result[len - 1].children.push({
          ...linkAttr,
          children: null,
          status: LinkStatus.NONE,
        });
      } else {
        result.push({
          ...linkAttr,
          children: null,
          status: LinkStatus.NONE,
        });
      }
    }
    link = reg.exec(tableOfContents);
  }
  return result;
};

interface MenuData {
  type: 'SubMenu' | 'Item';
  title: string;
  slug: string;
  order?: number;
  children?: MenuData[];
}

const getMenuData = ({ groupedEdges, language, docs = [], level = 0 }: any) => {
  const results = [] as MenuData[];
  Object.keys(groupedEdges).forEach((key: string) => {
    const edges = groupedEdges[key] || [];
    const categoryKey = getMenuItemLocaleKey(key);
    const category = getDocument(docs, categoryKey, level);
    if (!category) {
      if (categoryKey.split('/').length !== level + 1) {
        return;
      }
      edges.forEach((edge: any) => {
        const {
          node: {
            frontmatter: { title, order },
            fields: { slug },
          },
        } = edge;
        results.push({
          type: 'Item',
          slug,
          title,
          order,
        });
      });
    } else {
      const subGroupedEdges = {} as any;
      Object.keys(groupedEdges).forEach((item: string) => {
        if (item.startsWith(key)) {
          subGroupedEdges[item] = groupedEdges[item];
        }
      });
      results.push({
        type: 'SubMenu',
        title:
          category.title && category.title[language]
            ? category.title[language]
            : categoryKey,
        slug: key,
        order: category.order || 0,
        children: getMenuData({
          groupedEdges: subGroupedEdges,
          language,
          docs,
          level: level + 1,
        }),
      });
    }
  });
  return results.sort((a: any, b: any) => a.order - b.order);
};

const renderMenu = (menuData: MenuData[]) =>
  menuData.map((item: MenuData) => {
    if (item.type === 'Item') {
      return (
        <Menu.Item key={item.slug}>
          <Link to={item.slug}>{item.title}</Link>
        </Menu.Item>
      );
    }
    if (item.type === 'SubMenu') {
      return (
        item.children &&
        item.children.length > 0 && (
          <Menu.SubMenu key={item.slug} title={capitalize(item.title)}>
            {renderMenu(item.children)}
          </Menu.SubMenu>
        )
      );
    }
    return null;
  });

export const getGithubSourceUrl = ({
  githubUrl,
  relativePath,
  prefix,
}: {
  githubUrl: string;
  relativePath: string;
  prefix: string;
}): string => {
  // https://github.com/antvis/x6/tree/master/packages/x6-sites
  if (githubUrl.includes('/tree/master/')) {
    return `${githubUrl.replace(
      '/tree/master/',
      '/edit/master/',
    )}/${prefix}/${relativePath}`;
  }
  return `${githubUrl}/edit/master/${prefix}/${relativePath}`;
};

export default function Template({
  data, // this prop will be injected by the GraphQL query below.
  location,
  pageContext,
}: {
  data: any;
  location: Location;
  pageContext: {
    examples: any;
  };
}): React.ReactNode {
  const [prev, next] = usePrevAndNext();
  const { markdownRemark, allMarkdownRemark, site } = data; // data.markdownRemark holds our post data
  const { examples = [] } = pageContext;
  if (!markdownRemark) {
    return null;
  }
  const {
    frontmatter,
    htmlAst,
    tableOfContents,
    fields: { slug, readingTime },
    parent: { relativePath },
  } = markdownRemark;
  const { edges = [] } = allMarkdownRemark;
  const edgesInDocs = edges.filter((item: any) =>
    item.node.fields.slug.includes('/docs/'),
  );
  const {
    siteMetadata: { docs = [], githubUrl },
    pathPrefix,
  } = site;
  const pathWithoutPrefix = location.pathname.replace(
    new RegExp(`^${pathPrefix}`),
    '',
  );
  const { t, i18n } = useTranslation();
  const groupedEdges = groupBy(
    edgesInDocs,
    ({
      node: {
        fields: { slug: slugString },
      },
    }: any) => slugString.split('/').slice(0, -1).join('/'),
  );

  const filterGroupedEdges = {} as any;
  Object.keys(groupedEdges)
    .filter((key) => shouldBeShown(key, pathWithoutPrefix, i18n.language))
    .forEach((key: string) => {
      filterGroupedEdges[key] = groupedEdges[key];
    });

  const [openKeys, setOpenKeys] = useState<string[]>(
    Object.keys(filterGroupedEdges).filter((key) => slug.startsWith(key)),
  );

  const menuData = getMenuData({
    groupedEdges: filterGroupedEdges,
    language: i18n.language,
    docs,
  });

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[slug]}
      style={{ height: '100%' }}
      openKeys={openKeys}
      onOpenChange={(currentOpenKeys) =>
        setOpenKeys(currentOpenKeys as string[])
      }
      inlineIndent={16}
      forceSubMenuRender
    >
      {renderMenu(menuData)}
    </Menu>
  );

  const isWide = useMedia('(min-width: 767.99px)', true);
  const [drawOpen, setDrawOpen] = useState(false);
  const menuSider = (
    <Affix
      offsetTop={0}
      className={styles.affix}
      style={{ height: isWide ? '100vh' : 'inherit' }}
    >
      {isWide ? (
        <AntLayout.Sider width="auto" theme="light" className={styles.sider}>
          {menu}
        </AntLayout.Sider>
      ) : (
        <Drawer
          handler={
            drawOpen ? (
              <MenuFoldOutlined className={styles.menuSwitch} />
            ) : (
              <MenuUnfoldOutlined className={styles.menuSwitch} />
            )
          }
          wrapperClassName={styles.menuDrawer}
          onChange={(open) => setDrawOpen(!!open)}
          width={280}
        >
          {menu}
        </Drawer>
      )}
    </Affix>
  );

  const Playground = (props: any) => (
    <MdPlayground examples={examples} {...props} />
  );

  const renderAst = new RehypeReact({
    createElement: React.createElement,
    components: {
      swatch: Swatch,
      tag: CustomTag,
      playground: Playground,
    },
  }).Compiler;

  const [anchorLinks, setAnchorLinks] = useState(() =>
    getAnchorLinks(tableOfContents),
  );
  const changeAnchorLinkStatus = (index: number) => {
    const link = anchorLinks[index];
    const { status } = link;
    if (status === LinkStatus.NONE) {
      return;
    }
    const nextStatus =
      status === LinkStatus.EXPAND ? LinkStatus.FLOD : LinkStatus.EXPAND;
    setAnchorLinks(
      anchorLinks.map((item, i) => {
        if (i === index) {
          return {
            ...anchorLinks[i],
            status: nextStatus,
          };
        }
        return item;
      }),
    );
  };

  return (
    <>
      <SEO title={frontmatter.title} lang={i18n.language} />
      <AntLayout
        style={{ background: '#fff' }}
        hasSider
        className={styles.layout}
      >
        {menuSider}
        <Article className={styles.markdown}>
          <Affix offsetTop={8}>
            <div className={styles.toc}>
              <Anchor className={styles.apiAnchor}>
                {anchorLinks.map((link: LinkAttr, index: number) => (
                  <AnchorLink
                    key={link.href}
                    href={link.href}
                    title={
                      <div>
                        {link.status === LinkStatus.EXPAND && (
                          <CaretDownOutlined
                            style={{ color: '#8c8c8c' }}
                            onClick={() => changeAnchorLinkStatus(index)}
                          />
                        )}
                        {link.status === LinkStatus.FLOD && (
                          <CaretRightOutlined
                            style={{ color: '#8c8c8c' }}
                            onClick={() => changeAnchorLinkStatus(index)}
                          />
                        )}
                        {link.title}
                      </div>
                    }
                  >
                    {link.children &&
                      link.status === LinkStatus.EXPAND &&
                      link.children.map((child: LinkAttr) => (
                        <AnchorLink
                          key={child.href}
                          href={child.href}
                          title={child.title}
                        />
                      ))}
                  </AnchorLink>
                ))}
              </Anchor>
            </div>
          </Affix>
          <div className={styles.main}>
            <h1>
              {frontmatter.title}
              <Tooltip title={t('在 GitHub 上编辑')}>
                <a
                  href={getGithubSourceUrl({
                    githubUrl,
                    relativePath,
                    prefix: 'docs',
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.editOnGtiHubButton}
                >
                  <EditOutlined />
                </a>
              </Tooltip>
            </h1>
            <div className={styles.meta}>
              <ReadingTime readingTime={readingTime} />
            </div>
            <div className={styles.content}>{renderAst(htmlAst)}</div>
            <div>
              <NavigatorBanner type="prev" post={prev} />
              <NavigatorBanner type="next" post={next} />
              <BackTop style={{ right: 32 }}>
                <div className={styles.backTop}>
                  <VerticalAlignTopOutlined />
                </div>
              </BackTop>
            </div>
          </div>
        </Article>
      </AntLayout>
    </>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    site {
      siteMetadata {
        title
        githubUrl
        docs {
          slug
          title {
            zh
            en
          }
          order
        }
      }
      pathPrefix
    }
    markdownRemark(fields: { slug: { eq: $path } }) {
      htmlAst
      tableOfContents
      fields {
        slug
        readingTime {
          text
          time
        }
      }
      frontmatter {
        title
      }
      parent {
        ... on File {
          relativePath
        }
      }
    }
    allMarkdownRemark(
      filter: { fields: { slug: { regex: "//docs//" } } }
      sort: { order: ASC, fields: [frontmatter___order] }
      limit: 1000
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            order
          }
        }
      }
    }
  }
`;
