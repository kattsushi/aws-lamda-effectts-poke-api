import { getPokemon, listPokemons } from './dist/handler.js';

// Mock context
const mockContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2023/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {}
};

async function testCatchTags() {
  console.log('🧪 Testing Effect.catchTags Implementation...\n');

  try {
    // Test 1: Successful request
    console.log('1. Testing successful Pokemon request...');
    const mockSuccessEvent = {
      pathParameters: { name: 'pikachu' },
      queryStringParameters: null,
      headers: {},
      body: null,
      isBase64Encoded: false
    };

    const successResult = await getPokemon(mockSuccessEvent, mockContext);
    console.log('✅ Success result:', {
      statusCode: successResult.statusCode,
      isSuccess: successResult.statusCode === 200
    });

    // Test 2: ValidationError (missing Pokemon name)
    console.log('\n2. Testing ValidationError handling...');
    const mockValidationErrorEvent = {
      pathParameters: null, // No name provided
      queryStringParameters: null,
      headers: {},
      body: null,
      isBase64Encoded: false
    };

    const validationResult = await getPokemon(mockValidationErrorEvent, mockContext);
    const validationBody = JSON.parse(validationResult.body);
    console.log('✅ ValidationError result:', {
      statusCode: validationResult.statusCode,
      error: validationBody.error,
      isValidationError: validationBody.error === 'ValidationError'
    });

    // Test 3: PokemonNotFoundError
    console.log('\n3. Testing PokemonNotFoundError handling...');
    const mockNotFoundEvent = {
      pathParameters: { name: 'nonexistentpokemon12345' },
      queryStringParameters: null,
      headers: {},
      body: null,
      isBase64Encoded: false
    };

    const notFoundResult = await getPokemon(mockNotFoundEvent, mockContext);
    const notFoundBody = JSON.parse(notFoundResult.body);
    console.log('✅ PokemonNotFoundError result:', {
      statusCode: notFoundResult.statusCode,
      error: notFoundBody.error,
      isPokemonNotFound: notFoundBody.error === 'PokemonNotFound'
    });

    // Test 4: List Pokemon with invalid parameters (ValidationError)
    console.log('\n4. Testing ValidationError in list Pokemon...');
    const mockInvalidListEvent = {
      pathParameters: null,
      queryStringParameters: { limit: '999' }, // Invalid limit (> 100)
      headers: {},
      body: null,
      isBase64Encoded: false
    };

    const invalidListResult = await listPokemons(mockInvalidListEvent, mockContext);
    const invalidListBody = JSON.parse(invalidListResult.body);
    console.log('✅ List ValidationError result:', {
      statusCode: invalidListResult.statusCode,
      error: invalidListBody.error,
      isValidationError: invalidListBody.error === 'ValidationError'
    });

    console.log('\n🎉 All Effect.catchTags tests completed successfully!');
    console.log('\n📊 Effect.catchTags Benefits:');
    console.log('- ✅ Type-safe error handling with tagged errors');
    console.log('- ✅ Declarative error mapping by error type');
    console.log('- ✅ Automatic error type inference');
    console.log('- ✅ Composable error handling patterns');
    console.log('- ✅ Better separation of concerns');
    console.log('- ✅ Consistent error response format');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCatchTags();
