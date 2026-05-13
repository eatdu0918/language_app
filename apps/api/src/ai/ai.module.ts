import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AiService } from './ai.service'
import { OllamaProvider } from './providers/ollama.provider'
import { ClaudeProvider } from './providers/claude.provider'

export const AI_PROVIDER = 'AI_PROVIDER'

@Module({
  imports: [ConfigModule],
  providers: [
    OllamaProvider,
    ClaudeProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, OllamaProvider, ClaudeProvider],
      useFactory: (config: ConfigService, ollama: OllamaProvider, claude: ClaudeProvider) =>
        config.get('AI_PROVIDER', 'ollama') === 'claude' ? claude : ollama,
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
