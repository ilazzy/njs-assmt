export const up = async (queryInterface, Sequelize) => {
  await queryInterface.bulkInsert('destinations', [
    {
    URL: 'https://webhook.site/abc1',
    HTTP_method: 'POST',
    headers: JSON.stringify({ 'Content-Type': 'application/json' }),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    URL: 'https://webhook.site/def2',
    HTTP_method: 'POST',
    headers: JSON.stringify({ 'Content-Type': 'application/json' }),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    URL: 'https://webhook.site/ghi3',
    HTTP_method: 'POST',
    headers: JSON.stringify({ 'Content-Type': 'application/json' }),
    created_at: new Date(),
    updated_at: new Date()
  }
], {});
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.bulkDelete('destinations', null, {});
};
