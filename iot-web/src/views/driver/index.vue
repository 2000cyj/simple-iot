<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { DictEnumItem } from '@/api/dict'
import type { DriverPayload } from '@/api/driver'
import type { ConnectionTypeEnum, Driver, DriverTypeEnum } from '@/types/api'
import { Lightning, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getConnectionTypeEnum, getDriverTypeEnum } from '@/api/dict'
import { addDriver, deleteDriver, getDriverList, updateDriver } from '@/api/driver'
import IotTable from '@/components/IotTable.vue'
import PageHeader from '@/components/PageHeader.vue'

/**
 * IotTable 的列配置（最小结构）。
 *
 * IotTable 组件正在由其它 agent 并行改造，其 props 类型尚未定稿，
 * 这里按本页面实际用到的字段声明一份本地结构。
 */
interface TableColumn<TRow> {
  /** 列字段名 */
  prop?: string
  /** 列标题 */
  label?: string
  /** 列宽 */
  width?: number
  /** 最小列宽 */
  minWidth?: number
  /** 固定方式 */
  fixed?: boolean | string
  /** 对齐方式 */
  align?: string
  /** 自定义插槽名 */
  slot?: string
  /** 列类型 */
  type?: string
  /** 自定义渲染 */
  render?: (scope: { row: TRow }) => unknown
}

/** 驱动表单模型（新增 / 编辑共用） */
interface DriverFormModel {
  /** 驱动名称 */
  name: string
  /** 驱动类型 */
  type: DriverTypeEnum
  /** 连接类型 */
  connectionType: ConnectionTypeEnum
}

/** 驱动表单（后端实体字段除 driverId 外均可为空） */
interface DriverForm {
  /** 驱动 ID */
  driverId?: number
  /** 驱动名称 */
  name?: string
  /** 驱动类型 */
  type?: DriverTypeEnum
  /** 驱动描述 */
  description?: string
  /** 连接类型 */
  connectionType?: ConnectionTypeEnum
  /** 驱动 JAR 路径 */
  jarPath?: string
  /** 是否为默认驱动 */
  isDefault?: boolean
  /** 状态：1 启用 0 禁用 */
  status?: number
  /** 驱动监听端口 */
  port?: number | null
}

const { t } = useI18n()
const driverList = ref<Driver[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = ref<DriverForm>({})
const formRules = ref<FormRules<DriverFormModel>>({
  name: [
    { required: true, message: t('driver.driver_page'), trigger: 'blur' },
  ],
  type: [
    { required: true, message: t('driver.select_driver_type'), trigger: 'change' },
  ],
  connectionType: [
    { required: true, message: t('driver.select_connection_type'), trigger: 'change' },
  ],
})
const driverTypeOptions = ref<DictEnumItem[]>([])
const connectionTypeOptions = ref<DictEnumItem[]>([])
const formRef = ref<FormInstance | null>(null)

function fetchList() {
  getDriverList().then((res) => {
    driverList.value = res.data
  }).catch(() => {
    ElMessage.error(t('driver.failed_fetch_driver_list'))
  })
}

function handleAdd() {
  dialogTitle.value = t('driver.add_driver')
  form.value = { status: 1, connectionType: 'DEFAULT', port: null }
  dialogVisible.value = true
}

function handleEdit(row: Driver) {
  dialogTitle.value = t('driver.edit_driver')
  form.value = { ...row, port: row.port || null }
  dialogVisible.value = true
}

function handleSave() {
  formRef.value!.validate((valid) => {
    if (!valid)
      return

    // 验证端口号
    if (form.value.port && (form.value.port < 1 || form.value.port > 65535)) {
      ElMessage.error(t('driver.text'))
      return
    }

    // 验证TCP/UDP驱动必须配置端口
    if ((form.value.type === 'TCP' || form.value.type === 'UDP') && !form.value.port) {
      ElMessage.error(t('driver.tcp_udp'))
      return
    }

    // 表单允许字段缺省（新增场景未填名称等），
    // 而后端实体类型要求 name / type / connectionType 必填，这里按原有提交形态做一次类型断言。
    if (form.value.driverId) {
      updateDriver(form.value as DriverPayload).then(() => {
        ElMessage.success(t('driver.update_success'))
        dialogVisible.value = false
        form.value = {}
        fetchList()
      }).catch(() => {
        ElMessage.error(t('driver.update_failed'))
      })
    }
    else {
      addDriver(form.value as DriverPayload).then(() => {
        ElMessage.success(t('driver.create_success'))
        dialogVisible.value = false
        form.value = {}
        fetchList()
      }).catch(() => {
        ElMessage.error(t('driver.create_failed'))
      })
    }
  })
}

function handleDelete(row: Driver) {
  ElMessageBox.confirm(t('driver.you_sure_you_want_delete_this_driver'), t('common.tip'), {
    type: 'warning',
  }).then(() => {
    deleteDriver(row.driverId).then(() => {
      ElMessage.success(t('driver.delete_success'))
      fetchList()
    }).catch(() => {
      ElMessage.error(t('driver.delete_failed'))
    })
  })
}

onMounted(() => {
  getDriverTypeEnum().then((res) => {
    driverTypeOptions.value = res.data
  })
  getConnectionTypeEnum().then((res) => {
    connectionTypeOptions.value = res.data
  })
  fetchList()
})

// 监听驱动类型变化
watch(() => form.value.type, (newType) => {
  if (newType !== 'TCP' && newType !== 'UDP') {
    form.value.port = null
  }
})

// 监听对话框关闭
watch(dialogVisible, (visible) => {
  if (!visible) {
    form.value = {}
    formRef.value?.clearValidate()
  }
})

const columns = computed<TableColumn<Driver>[]>(() => [
  { prop: 'driverId', label: 'ID', width: 80 },
  { prop: 'name', label: t('driver.driver_name') },
  { prop: 'type', label: t('common.type'), slot: 'type' },
  { prop: 'connectionType', label: t('driver.connection_type') },
  { prop: 'port', label: t('common.port'), width: 100, render: ({ row }) => row.port || '-' },
  { prop: 'description', label: t('common.description') },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' },
  { prop: 'cz', slot: 'cz', width: 200, label: t('common.operation') },
])
</script>

<template>
  <div class="page-container">
    <PageHeader
      :title="t('driver.driver')"
      :subtitle="t('driver.manage_configure_device_communication_drivers')"
      :icon="Lightning"
    >
      <template #actions>
        <el-button :icon="Refresh" @click="fetchList">
          {{ t('common.refresh') }}
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          {{ t('driver.add_driver') }}
        </el-button>
      </template>
    </PageHeader>

    <!-- 数据表格 -->
    <IotTable :columns="columns" :data="driverList" :is-page="false">
      <template #type="{ row }">
        <el-tag :type="row.type === 'TCP' ? 'primary' : row.type === 'UDP' ? 'success' : 'warning'">
          {{ row.type }}
        </el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'info'">
          {{ row.status === 1 ? t('common.enable') : t('driver.disable') }}
        </el-tag>
      </template>
      <template #cz="{ row }">
        <el-button size="small" link type="primary" @click="handleEdit(row)">
          {{ t('common.edit') }}
        </el-button>
        <el-button size="small" link type="danger" @click="handleDelete(row)">
          {{ t('common.delete') }}
        </el-button>
      </template>
    </IotTable>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item :label="t('driver.driver_name')" prop="name">
          <el-input v-model="form.name" :placeholder="t('driver.driver_page')" />
        </el-form-item>
        <el-form-item :label="t('driver.driver_type')" prop="type">
          <el-select v-model="form.type" :placeholder="t('driver.select_driver_type')" style="width: 100%">
            <el-option v-for="item in driverTypeOptions" :key="item.code" :label="item.desc" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('driver.connection_type')" prop="connectionType">
          <el-select v-model="form.connectionType" :placeholder="t('driver.select_connection_type')" style="width: 100%">
            <el-option v-for="item in connectionTypeOptions" :key="item.code" :label="item.desc" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === 'TCP' || form.type === 'UDP'" :label="t('common.port')" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" :placeholder="t('driver.enter_port')" style="width: 100%" />
          <div class="form-tip">
            {{ t('driver.tcp_udp_drivers_require_listening_port_1_65535') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('common.description')">
          <el-input v-model="form.description" type="textarea" :rows="3" :placeholder="t('driver.enter_driver_description')" />
        </el-form-item>
        <el-form-item v-if="form.connectionType === 'CUSTOM'" :label="t('driver.jar_path')">
          <el-input v-model="form.jarPath" :placeholder="t('driver.enter_jar_file_path')" />
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            :active-text="t('common.enable')"
            :inactive-text="t('driver.disable')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleSave">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: var(--iot-color-text-muted);
  margin-top: var(--space-xs);
  line-height: 1.4;
}
</style>
