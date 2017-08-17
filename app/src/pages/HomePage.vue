<template>
  <div>
    <h1>Home Page</h1>
    <ip-geo-form></ip-geo-form>
  </div>
</template>

<script>
  import IpGeoForm from '@/components/IpGeoForm'

  export default {
    name: 'HomePage',
    data () {
      return {}
    },
    components: {
      IpGeoForm
    }
  }
</script>