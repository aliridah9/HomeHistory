import { Controller, Get } from '@nestjs/common'

@Controller('faqs')
export class FaqController {
  @Get()
  async list() {
    return [
      { q:'What types of properties can I find on this platform?', a:'Residential, land, commercial, and more across buy/rent/sell/auction.' },
      { q:'How do reports work?', a:'Enter an address to generate ownership, permits, liens, and comps.' },
    ]
  }
}


