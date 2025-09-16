export const up = async (queryInterface, Sequelize) => {
  await queryInterface.bulkInsert('accounts', [
    {
      account_name: 'Test Account 1',
      app_secret_token: 'secret1',
      website: 'https://test1.com',
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      account_name: 'Test Account 2',
      app_secret_token: 'secret2',
      website: 'https://test2.com',
      created_by: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ], {});
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.bulkDelete('accounts', null, {});
};
