import {createMiddleware} from 'langchain';
import {StateSchema} from '@langchain/langgraph';
import z from 'zod';

const MyState = new StateSchema({
    userId: z.string(),
    callCount: z.number().default(8),
});

const stateMiddleware = createMiddleware({
    name: 'StateExtension',
    stateSchema: MyState,
});

export default stateMiddleware;
