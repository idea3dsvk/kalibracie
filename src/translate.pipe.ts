import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // This makes the pipe re-evaluate when the language changes
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  
  transform(key: string): string {
    return this.translationService.translate(key);
  }
}
