import { Menu, Transition } from "@headlessui/react";
import useAvatar from "../../../hooks/useAvatar";
import useDisplayName from "../../../hooks/useDisplayName";
import { useWeb3 } from "../../../web3";
import DownArrow from "../svg/DownArrow";
import Avatar from "./Avatar";
import MenuItems from "./MenuItems";

const ConnectWallet = ({ account }: { account?: string }) => {
  if (account) {
    return null;
  }
  return <span className="text-sm text-gold-500">Connect Wallet</span>;
};

const WalletConnected = ({ account }: { account?: string }) => {
  const accountDisplayName = useDisplayName(account);
  const avatarURL = useAvatar(account);

  if (!account) {
    return null;
  }
  return (
    <>
      <Avatar address={account} url={avatarURL} />
      <div className="pl-2 flex flex-col items-end">
        <div className="sm:text-right text-sm text-gold-500">{accountDisplayName}</div>
      </div>
    </>
  );
};

const HeaderMenu = () => {
  const { account } = useWeb3();
  return (
    <div className="flex items-center justify-center relative">
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button className="transition duration-150 ease-in-out hover:text-stone-300 focus:outline-none flex items-center">
              <ConnectWallet account={account} />
              <WalletConnected account={account} />
              <div className="text-sm font-medium text-white hover:text-stone-300 focus:shadow-outline-blue">
                <DownArrow />
              </div>
            </Menu.Button>

            <Transition
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <MenuItems />
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );
};

export default HeaderMenu;
