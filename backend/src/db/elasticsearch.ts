import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  ...(process.env.ELASTICSEARCH_API_KEY ? { auth: { apiKey: process.env.ELASTICSEARCH_API_KEY } } : {})
});
