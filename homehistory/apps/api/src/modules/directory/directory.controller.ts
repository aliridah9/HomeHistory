import { Controller, Get, Param } from '@nestjs/common'

@Controller('directory')
export class DirectoryController {
  @Get(':kind')
  async list(@Param('kind') kind: 'lenders'|'agents'|'contractors') {
    return [
      { id:'1', name:'Lauren Drew', role:'Lender', rating:4.9, months:32, clients:278, success:0.91, projects:9 },
      { id:'2', name:'Jasper Nguyen', role:'Agent', rating:4.7, months:28, clients:198, success:0.88, projects:7 },
    ]
  }
}


