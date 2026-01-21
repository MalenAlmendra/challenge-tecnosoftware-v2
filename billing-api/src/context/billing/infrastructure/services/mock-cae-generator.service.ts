import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CaeGenerator } from '../../application/ports/services/cae-generator.port';

@Injectable()
export class MockCaeGeneratorService implements CaeGenerator {
  async generate(): Promise<string> {
    const stamp = Date.now().toString();
    return `CAE-${stamp}-${randomUUID().slice(0, 8)}`.toUpperCase();
  }
}
