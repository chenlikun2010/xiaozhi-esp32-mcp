/**
 * 已下线：私人知识库检索工具已从开源版移除。
 */

export const PrivateDocsSearchDefinition = {
  name: 'private_docs_removed',
  description: 'Removed in open-source edition.',
  schema: {}
};

export async function handlePrivateDocsSearch() {
  return {
    content: [{ type: 'text', text: '该功能已下线。' }],
    isError: true,
  };
}
