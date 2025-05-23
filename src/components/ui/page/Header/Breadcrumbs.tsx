import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
export type Crumb = {
  terminus: string;
  path: string;
};
interface BreadcrumbsProps {
  links: Crumb[];
  w?: {
    base: string;
    sm: string;
  };
}

export default function Breadcrumbs({
  links,
  w = { base: 'min-content', sm: 'initial' },
}: BreadcrumbsProps) {
  return (
    <Breadcrumb
      display="flex"
      alignItems="center"
      color="neutral-7"
      w={w}
      listProps={{ flexWrap: 'wrap' }}
    >
      {links.map(({ terminus: title, path }, i) => {
        const isCurrentPage = i === links.length - 1;
        const crumbText = (
          <Text
            maxWidth="250px"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            textStyle="labels-large"
            color={isCurrentPage ? 'neutral-7' : 'color-neutral-400'}
          >
            {title}
          </Text>
        );

        return (
          <BreadcrumbItem
            key={path + title}
            isCurrentPage={isCurrentPage}
            color="neutral-7"
            textStyle="labels-large"
          >
            {isCurrentPage ? (
              crumbText
            ) : (
              <BreadcrumbLink
                as={Link}
                to={path}
                display="flex"
                alignItems="center"
                _hover={{ textDecoration: 'none', color: 'neutral-7' }} // Guessed. Probaby incorrect, couldn't find on figma
              >
                {crumbText}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
