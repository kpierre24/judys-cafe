<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCRMStore } from '@/stores/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserPlusIcon,
  StarIcon,
  GiftIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import type { Customer, CustomerFeedback, PromotionalCampaign } from '@/stores/crm'

const crmStore = useCRMStore()

const activeTab = ref('overview')
const showAddCustomerDialog = ref(false)
const showFeedbackDialog = ref(false)
const showCampaignDialog = ref(false)
const selectedFeedback = ref<CustomerFeedback | null>(null)

// Forms
const newCustomer = ref<Partial<Customer>>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferences: {
    favoriteProducts: [],
    allergens: [],
    dietaryRestrictions: [],
    communicationPreference: 'email',
  },
  isActive: true,
})

const feedbackResponse = ref('')

const newCampaign = ref<Partial<PromotionalCampaign>>({
  name: '',
  description: '',
  type: 'seasonal',
  startDate: new Date(),
  endDate: new Date(),
  offer: {
    type: 'percentage_discount',
    value: 10,
  },
  channels: ['email'],
  status: 'draft',
})

// Computed
const recentCustomers = computed(() => {
  return crmStore.customers
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const highValueCustomers = computed(() => {
  const customers = crmStore.customers.filter(
    (customer) => customer.loyaltyCard.tier === 'gold' || customer.loyaltyCard.tier === 'platinum',
  )

  return customers.sort((a, b) => b.loyaltyCard.totalSpent - a.loyaltyCard.totalSpent)
})

const urgentFeedback = computed(() => {
  return crmStore.feedback.filter((fb) => fb.priority === 'urgent' || fb.priority === 'high')
})

// Functions
function addCustomer() {
  if (newCustomer.value.firstName && newCustomer.value.lastName) {
    crmStore.addCustomer(
      newCustomer.value as Omit<
        Customer,
        'id' | 'customerId' | 'loyaltyCard' | 'createdAt' | 'branchId'
      >,
    )
    resetNewCustomer()
    showAddCustomerDialog.value = false
  }
}

function resetNewCustomer() {
  newCustomer.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferences: {
      favoriteProducts: [],
      allergens: [],
      dietaryRestrictions: [],
      communicationPreference: 'email',
    },
    isActive: true,
  }
}

function getTierColor(tier: string) {
  const colors = {
    bronze: 'bg-orange-100 text-orange-800',
    silver: 'bg-gray-100 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800',
  }
  return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getFeedbackPriorityColor(priority: string) {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

function respondToFeedback() {
  if (selectedFeedback.value && feedbackResponse.value.trim()) {
    crmStore.respondToFeedback(selectedFeedback.value.id, feedbackResponse.value, 'Manager')
    feedbackResponse.value = ''
    selectedFeedback.value = null
    showFeedbackDialog.value = false
  }
}

function openFeedbackResponse(feedback: CustomerFeedback) {
  selectedFeedback.value = feedback
  showFeedbackDialog.value = true
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function addLoyaltyPoints(customerId: string) {
  const points = prompt('Enter points to add:')
  if (points && !isNaN(Number(points))) {
    crmStore.addLoyaltyPoints(customerId, Number(points))
  }
}

function resetNewCampaign() {
  newCampaign.value = {
    name: '',
    description: '',
    type: 'seasonal',
    startDate: new Date(),
    endDate: new Date(),
    offer: {
      type: 'percentage_discount',
      value: 10,
    },
    channels: ['email'],
    status: 'draft',
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Customer Relationship Management</h1>
      <div class="flex space-x-2">
        <Button @click="showCampaignDialog = true" variant="outline">
          <GiftIcon class="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
        <Button @click="showAddCustomerDialog = true">
          <UserPlusIcon class="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>
    </div>

    <!-- Analytics Overview -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Total Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ crmStore.customerAnalytics.totalCustomers }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">New This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-600">
            {{ crmStore.customerAnalytics.newCustomersThisMonth }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Avg. Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatCurrency(crmStore.customerAnalytics.averageSpendPerCustomer) }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Loyalty Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-purple-600">
            {{ crmStore.customerAnalytics.loyaltyProgramParticipation.toFixed(1) }}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Pending Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-orange-600">
            {{ crmStore.pendingFeedback.length }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="feedback">Feedback</TabsTrigger>
        <TabsTrigger value="mobile-orders">Mobile Orders</TabsTrigger>
      </TabsList>

      <!-- Overview Tab -->
      <TabsContent value="overview" class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Customers -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center">
                <UserPlusIcon class="h-5 w-5 mr-2" />
                Recent Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div
                  v-for="customer in recentCustomers"
                  :key="customer.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                    >
                      {{ customer.firstName.charAt(0) }}{{ customer.lastName.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-medium">{{ customer.firstName }} {{ customer.lastName }}</p>
                      <p class="text-sm text-gray-600">{{ customer.email }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span
                      :class="`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(customer.loyaltyCard.tier)}`"
                    >
                      {{ customer.loyaltyCard.tier.toUpperCase() }}
                    </span>
                    <p class="text-xs text-gray-500 mt-1">{{ customer.loyaltyCard.points }} pts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Urgent Feedback -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center">
                <ExclamationTriangleIcon class="h-5 w-5 mr-2 text-orange-500" />
                Urgent Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div v-if="urgentFeedback.length === 0" class="text-gray-500 text-sm">
                  No urgent feedback
                </div>
                <div
                  v-for="feedback in urgentFeedback"
                  :key="feedback.id"
                  class="flex items-start justify-between p-3 bg-orange-50 rounded"
                >
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm">{{ renderStars(feedback.rating) }}</span>
                      <span
                        :class="`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackPriorityColor(feedback.priority)}`"
                      >
                        {{ feedback.priority.toUpperCase() }}
                      </span>
                    </div>
                    <p class="font-medium mt-1">{{ feedback.title }}</p>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ feedback.message.substring(0, 100) }}...
                    </p>
                  </div>
                  <Button size="sm" @click="openFeedbackResponse(feedback)"> Respond </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Customers Tab -->
      <TabsContent value="customers" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="customer in crmStore.customers"
                :key="customer.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex items-center space-x-4">
                  <div
                    class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                  >
                    {{ customer.firstName.charAt(0) }}{{ customer.lastName.charAt(0) }}
                  </div>
                  <div>
                    <h3 class="font-semibold">{{ customer.firstName }} {{ customer.lastName }}</h3>
                    <p class="text-sm text-gray-600">{{ customer.email }}</p>
                    <div class="flex items-center space-x-2 mt-1">
                      <span class="text-xs text-gray-500">{{ customer.customerId }}</span>
                      <span
                        :class="`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(customer.loyaltyCard.tier)}`"
                      >
                        {{ customer.loyaltyCard.tier.toUpperCase() }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="text-right space-y-1">
                  <p class="text-sm font-medium">{{ customer.loyaltyCard.points }} Points</p>
                  <p class="text-sm text-gray-600">
                    {{ formatCurrency(customer.loyaltyCard.totalSpent) }} spent
                  </p>
                  <p class="text-xs text-gray-500">{{ customer.loyaltyCard.visitCount }} visits</p>
                  <Button size="sm" variant="outline" @click="addLoyaltyPoints(customer.id)">
                    Add Points
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Loyalty Program Tab -->
      <TabsContent value="loyalty" class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Program Details -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center">
                <StarIcon class="h-5 w-5 mr-2 text-yellow-500" />
                {{ crmStore.loyaltyProgram?.name }}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-gray-600 mb-4">{{ crmStore.loyaltyProgram?.description }}</p>
              <div class="space-y-3">
                <div
                  v-for="tier in crmStore.loyaltyProgram?.tiers"
                  :key="tier.name"
                  class="border rounded p-3"
                >
                  <div class="flex items-center justify-between">
                    <span
                      :class="`px-2 py-1 rounded-full text-sm font-medium ${getTierColor(tier.name)}`"
                    >
                      {{ tier.name.toUpperCase() }}
                    </span>
                    <span class="text-sm text-gray-600">{{ tier.minPoints }}+ points</span>
                  </div>
                  <div class="mt-2">
                    <p class="text-sm font-medium">Benefits:</p>
                    <ul class="text-xs text-gray-600 list-disc list-inside">
                      <li v-for="benefit in tier.benefits" :key="benefit">{{ benefit }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Top Customers -->
          <Card>
            <CardHeader>
              <CardTitle>Top Loyalty Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div
                  v-for="(customer, index) in highValueCustomers.slice(0, 10)"
                  :key="customer.id"
                  class="flex items-center justify-between p-2 border rounded"
                >
                  <div class="flex items-center space-x-3">
                    <span
                      class="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      {{ index + 1 }}
                    </span>
                    <div>
                      <p class="font-medium text-sm">
                        {{ customer.firstName }} {{ customer.lastName }}
                      </p>
                      <span
                        :class="`px-1 py-0.5 rounded text-xs font-medium ${getTierColor(customer.loyaltyCard.tier)}`"
                      >
                        {{ customer.loyaltyCard.tier.toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <div class="text-right text-xs">
                    <p class="font-medium">{{ customer.loyaltyCard.points }} pts</p>
                    <p class="text-gray-600">
                      {{ formatCurrency(customer.loyaltyCard.totalSpent) }}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Campaigns Tab -->
      <TabsContent value="campaigns" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Marketing Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="campaign in crmStore.campaigns"
                :key="campaign.id"
                class="border rounded-lg p-4"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <h3 class="font-semibold">{{ campaign.name }}</h3>
                      <Badge :variant="campaign.status === 'active' ? 'default' : 'secondary'">
                        {{ campaign.status.toUpperCase() }}
                      </Badge>
                      <Badge variant="outline">{{
                        campaign.type.replace('_', ' ').toUpperCase()
                      }}</Badge>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{{ campaign.description }}</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span class="text-gray-500">Sent:</span>
                        <span class="font-medium ml-1">{{ campaign.metrics.sentCount }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">Open Rate:</span>
                        <span class="font-medium ml-1"
                          >{{ campaign.metrics.openRate.toFixed(1) }}%</span
                        >
                      </div>
                      <div>
                        <span class="text-gray-500">Click Rate:</span>
                        <span class="font-medium ml-1"
                          >{{ campaign.metrics.clickRate.toFixed(1) }}%</span
                        >
                      </div>
                      <div>
                        <span class="text-gray-500">Revenue:</span>
                        <span class="font-medium ml-1">{{
                          formatCurrency(campaign.metrics.revenue)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Feedback Tab -->
      <TabsContent value="feedback" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="feedback in crmStore.feedback"
                :key="feedback.id"
                class="border rounded-lg p-4"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <span class="text-sm">{{ renderStars(feedback.rating) }}</span>
                      <span
                        :class="`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackPriorityColor(feedback.priority)}`"
                      >
                        {{ feedback.priority.toUpperCase() }}
                      </span>
                      <Badge :variant="feedback.status === 'responded' ? 'default' : 'secondary'">
                        {{ feedback.status.toUpperCase() }}
                      </Badge>
                    </div>
                    <h3 class="font-semibold mt-2">{{ feedback.title }}</h3>
                    <p class="text-sm text-gray-600 mt-1">{{ feedback.message }}</p>
                    <p class="text-xs text-gray-500 mt-2">{{ formatDate(feedback.createdAt) }}</p>

                    <div v-if="feedback.response" class="mt-3 p-3 bg-blue-50 rounded">
                      <p class="text-sm font-medium text-blue-800">Response:</p>
                      <p class="text-sm text-blue-700">{{ feedback.response.message }}</p>
                      <p class="text-xs text-blue-600 mt-1">
                        By {{ feedback.response.respondedBy }} -
                        {{ formatDate(feedback.response.respondedAt) }}
                      </p>
                    </div>
                  </div>
                  <div v-if="!feedback.response" class="ml-4">
                    <Button size="sm" @click="openFeedbackResponse(feedback)"> Respond </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Mobile Orders Tab -->
      <TabsContent value="mobile-orders" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <DevicePhoneMobileIcon class="h-5 w-5 mr-2" />
              Mobile Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-center py-8 text-gray-500">
              <DevicePhoneMobileIcon class="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p class="text-lg font-medium">Mobile Ordering Coming Soon</p>
              <p class="text-sm">Customers will be able to place orders through the mobile app</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Add Customer Dialog -->
    <Dialog v-model:open="showAddCustomerDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">First Name</label>
              <Input v-model="newCustomer.firstName" />
            </div>
            <div>
              <label class="text-sm font-medium">Last Name</label>
              <Input v-model="newCustomer.lastName" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Email</label>
              <Input v-model="newCustomer.email" type="email" />
            </div>
            <div>
              <label class="text-sm font-medium">Phone</label>
              <Input v-model="newCustomer.phone" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Communication Preference</label>
            <Select v-model="newCustomer.preferences!.communicationPreference">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div class="flex justify-end space-x-2">
          <Button variant="outline" @click="showAddCustomerDialog = false">Cancel</Button>
          <Button @click="addCustomer">Add Customer</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Feedback Response Dialog -->
    <Dialog v-model:open="showFeedbackDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Respond to Feedback</DialogTitle>
        </DialogHeader>
        <div v-if="selectedFeedback" class="space-y-4 py-4">
          <div class="p-3 bg-gray-50 rounded">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-sm">{{ renderStars(selectedFeedback.rating) }}</span>
              <span
                :class="`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackPriorityColor(selectedFeedback.priority)}`"
              >
                {{ selectedFeedback.priority.toUpperCase() }}
              </span>
            </div>
            <h3 class="font-semibold">{{ selectedFeedback.title }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ selectedFeedback.message }}</p>
          </div>
          <div>
            <label class="text-sm font-medium">Your Response</label>
            <textarea
              v-model="feedbackResponse"
              class="w-full mt-1 p-2 border rounded-md"
              rows="4"
              placeholder="Enter your response to the customer..."
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end space-x-2">
          <Button variant="outline" @click="showFeedbackDialog = false">Cancel</Button>
          <Button @click="respondToFeedback">Send Response</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
