import { Link } from '@chakra-ui/react';
import useSubDomain from '../../hooks/useSubDomain';

function EtherscanLinkNFT({
  address,
  tokenId,
  children,
}: {
  address: string;
  tokenId: string;
  children: React.ReactNode;
}) {
  const subdomain = useSubDomain();
  return (
    <Link
      href={`https://${subdomain}etherscan.io/nft/${address}/${tokenId}`}
      isExternal
    >
      {children}
    </Link>
  );
}

export default EtherscanLinkNFT;
