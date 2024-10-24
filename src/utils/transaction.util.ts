import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { ClientSession, Connection } from 'mongoose';

export const transaction = async <T>(
  connection: Connection,
  cb: (session: ClientSession) => Promise<T>,
): Promise<T> => {
  const session = await connection.startSession();

  try {
    session.startTransaction();
    const result = await cb(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();

    if (err instanceof HttpException) {
      throw err;
    }
    console.log(err);
    throw new InternalServerErrorException(err);
  } finally {
    await session.endSession();
  }
};
