import inputStyles from './input';
import scrollStyles from './scroll';

export default {
  global: () => ({
    body: {
      background: 'color-black',
      backgroundRepeat: 'no-repeat',
      fontFamily: 'DM Sans',
      textStyle: 'body-small',
      color: 'white-0',
      height: '100%',
    },
    html: {
      background: 'color-black',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      scrollBehavior: 'smooth',
      height: '100%',
    },
    ...scrollStyles,
    ...inputStyles,
  }),
};
