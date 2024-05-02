import { defineAbilityFor } from '@saas/auth'

const ability = defineAbilityFor({ role: 'MEMBER', id: '1' })

console.log(ability.can('get', 'Billing'))
