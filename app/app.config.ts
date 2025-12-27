export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'purple',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'slate',
    },
    selectMenu: {
      slots: {
        content: 'min-w-fit',
      },
    },
  },
});
