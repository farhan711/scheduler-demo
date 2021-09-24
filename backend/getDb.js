'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event, context, callback) => {
  const params = {
    TableName: 'Scheudler',
    Key: {
      id: 'email',
    },
  };

  // fetch todo from the database
  const rate = await dynamoDb.get(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the todo item.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
    callback(null, response);
  });
  const dataQ = await scanTable('Scheudler');
  console.log(dataQ)
};

const scanTable = async (tableName) => {
    const params = { TableName: tableName };

    let scanResults = [];
    let items;
    do{
        items =  await documentClient.scan(params).promise();
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    } while(typeof items.LastEvaluatedKey != "undefined");
    return scanResults;
}
