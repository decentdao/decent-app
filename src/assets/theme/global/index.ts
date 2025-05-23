import inputStyles from './input';
import scrollStyles from './scroll';

export default {
  global: () => ({
    body: {
      background: 'neutral-1',
      backgroundRepeat: 'no-repeat',
      fontFamily: 'DM Sans',
      textStyle: 'text-base-regular',
      color: 'white-0',
      height: '100%',
    },
    html: {
      background: 'neutral-1',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      scrollBehavior: 'smooth',
      height: '100%',
    },
    ...scrollStyles,
    ...inputStyles,
  }),
};
