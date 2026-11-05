<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import type { OtaTaskCreateQuery } from '@/api/ota'
import type { Device, DeviceGroup, Firmware, OtaTask, Product, ProductType } from '@/types/api'
import { Refresh, Upload, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { deviceGroupTreeApi } from '@/api/deviceGroup'
import { deviceListApi, productListApi, productTypeListApi } from '@/api/index'
import { firmwareDeleteApi, firmwareListApi, firmwarePublishApi, firmwareUploadApi, otaTaskCreateApi, otaTaskGetApi, otaTaskListApi } from '@/api/ota'
import IotTable from '@/components/IotTable.vue'
import PageHeader from '@/components/PageHeader.vue'
import { normalizePage } from '@/utils/page'

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

/** 固件上传表单 */
interface FirmwareUploadForm {
  /** 产品 ID */
  productId: number | null
  /** 固件名称 */
  name: string
  /** 版本号 */
  version: string
  /** 描述 */
  description: string
  /** 待上传的固件文件 */
  file: File | null
}

/** 升级任务表单 */
interface OtaTaskForm {
  /** 固件 ID */
  firmwareId: number | null
  /** 目标分组 ID */
  groupId: number | null
  /** 指定设备 ID 列表 */
  deviceIds: number[]
}

/** 升级任务进度行（由 taskDetail.progress 的键值对展开得到） */
interface ProgressRow {
  /** 设备 ID */
  deviceId: string
  /** 升级结果描述 */
  status: string
}

const activeTab = ref('firmware')
const loading = ref(false)

// === Firmware ===
const firmwareList = ref<Firmware[]>([])
const uploadVisible = ref(false)
const uploadForm = ref<FirmwareUploadForm>({ productId: null, name: '', version: '', description: '', file: null })
const products = ref<Product[]>([])
const productTypes = ref<ProductType[]>([])
const filterProductTypeId = ref<number | null>(null)

const filteredProducts = computed(() => {
  if (!filterProductTypeId.value)
    return products.value
  return products.value.filter(p => p.productTypeId === filterProductTypeId.value)
})

// === Tasks ===
const taskList = ref<OtaTask[]>([])
const taskDialogVisible = ref(false)
const taskForm = ref<OtaTaskForm>({ firmwareId: null, groupId: null, deviceIds: [] })
const taskDetailVisible = ref(false)
const taskDetail = ref<OtaTask | null>(null)
const groups = ref<DeviceGroup[]>([])
const devices = ref<Device[]>([])

async function loadFirmware() {
  loading.value = true
  const res = await firmwareListApi()
  firmwareList.value = res.data || []
  loading.value = false
}

async function loadProducts() {
  // 原代码此处无参调用，而 productListApi 会解构入参，运行时必然抛 TypeError，
  // 导致产品下拉恒为空；这里补上空对象参数（与 modbus 页面的调用方式一致）。
  const res = await productListApi({})
  products.value = res.data || []
}

async function loadProductTypes() {
  const res = await productTypeListApi()
  productTypes.value = res.data || []
}

async function loadGroups() {
  const res = await deviceGroupTreeApi()
  groups.value = res.data || []
}

async function loadDevices() {
  // 历史遗留：后端 GET /device/list 不分页，这里的 page / size 会被忽略
  const res = await deviceListApi({ page: 1, size: 9999 })
  // 存量 bug 修复：deviceListApi 走 GET /device/list，返回 BaseResult<List<Device>>，
  // res.data 是数组、没有 records 字段，原写法 res.data?.records 恒为 undefined，
  // 导致设备下拉恒为空。改用 normalizePage 统一兼容数组与分页对象两种形态。
  devices.value = normalizePage<Device>(res).records
}

function onUploadFile(file: UploadFile) {
  uploadForm.value.file = file.raw ?? null
}

async function onSubmitUpload() {
  const { productId, name, version, description, file } = uploadForm.value
  if (!productId || !name || !version || !file) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', String(productId))
  formData.append('name', name)
  formData.append('version', version)
  formData.append('description', description || '')
  await firmwareUploadApi(formData)
  ElMessage.success('上传成功')
  uploadVisible.value = false
  uploadForm.value = { productId: null, name: '', version: '', description: '', file: null }
  loadFirmware()
}

async function onPublish(id: number) {
  await ElMessageBox.confirm('确认发布该固件?', '提示', { type: 'warning' })
  await firmwarePublishApi(id)
  ElMessage.success('已发布')
  loadFirmware()
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确认删除该固件?', '提示', { type: 'warning' })
  await firmwareDeleteApi(id)
  ElMessage.success('已删除')
  loadFirmware()
}

// === Tasks ===
async function loadTasks() {
  loading.value = true
  const res = await otaTaskListApi()
  taskList.value = res.data || []
  loading.value = false
}

function openCreateTask(firmwareId: number) {
  taskForm.value = { firmwareId, groupId: null, deviceIds: [] }
  taskDialogVisible.value = true
}

async function onSubmitTask() {
  const params: OtaTaskCreateQuery = {
    // 打开弹窗时 firmwareId 一定已被赋值
    firmwareId: taskForm.value.firmwareId as number,
  }
  if (taskForm.value.groupId)
    params.groupId = taskForm.value.groupId
  if (taskForm.value.deviceIds.length)
    params.deviceIds = taskForm.value.deviceIds
  await otaTaskCreateApi(params)
  ElMessage.success('升级任务已创建')
  taskDialogVisible.value = false
  loadTasks()
}

const firmwareName = computed(() => (id: number | null | undefined) => firmwareList.value.find(f => f.id === id)?.name || `#${id}`)

const taskDetailTimer: { current: ReturnType<typeof setInterval> | null } = { current: null }

function onTaskDetail(id: number) {
  otaTaskGetApi(id).then((res) => {
    taskDetail.value = res.data
    taskDetailVisible.value = true
    // ponytail: auto-refresh if task is still running
    if (res.data && res.data.status === 'RUNNING') {
      if (taskDetailTimer.current)
        clearInterval(taskDetailTimer.current)
      taskDetailTimer.current = setInterval(async () => {
        const r = await otaTaskGetApi(id)
        taskDetail.value = r.data
        if (!r.data || r.data.status !== 'RUNNING') {
          if (taskDetailTimer.current)
            clearInterval(taskDetailTimer.current)
          taskDetailTimer.current = null
        }
      }, 3000)
    }
  })
}

function onTaskDetailClose() {
  if (taskDetailTimer.current) {
    clearInterval(taskDetailTimer.current)
    taskDetailTimer.current = null
  }
}

watch(activeTab, (v) => {
  if (v === 'task')
    loadTasks()
})

onMounted(() => {
  loadProducts()
  loadProductTypes()
  loadFirmware()
  loadTasks()
  loadGroups()
  loadDevices()
})

const firmwareColumns = computed<TableColumn<Firmware>[]>(() => [
  { prop: 'name', label: '名称', minWidth: 120 },
  { prop: 'version', label: '版本', width: 80 },
  { prop: 'productId', label: '产品', width: 120, render: ({ row }) => products.value.find(p => p.id === row.productId)?.model || row.productId },
  { prop: 'fileSize', label: '大小', width: 80, render: ({ row }) => row.fileSize ? `${(row.fileSize / 1024).toFixed(0)}KB` : '-' },
  { prop: 'status', label: '状态', width: 80, slot: 'fwStatus' },
  { prop: 'createTime', label: '创建时间', width: 160 },
  { prop: 'cz', slot: 'fwCz', label: '操作', width: 200, fixed: 'right' },
])

const taskColumns = computed<TableColumn<OtaTask>[]>(() => [
  // 脚本里拿到的是 ComputedRef，必须取 .value 后再调用；
  // 原代码直接调用 computed 本身，运行时必然抛 “not a function”。
  { prop: 'firmwareId', label: '固件', width: 120, render: ({ row }) => firmwareName.value(row.firmwareId) },
  { prop: 'status', label: '状态', width: 100, slot: 'taskStatus' },
  { prop: 'total', label: '总数', width: 60 },
  { prop: 'success', label: '成功', width: 60 },
  { prop: 'fail', label: '失败', width: 60 },
  { prop: 'createTime', label: '创建时间', width: 160 },
  { prop: 'cz', slot: 'taskCz', label: '操作', width: 100, fixed: 'right' },
])

const progressColumns = computed<TableColumn<ProgressRow>[]>(() => [
  { prop: 'deviceId', label: '设备ID', width: 100 },
  { prop: 'status', label: '状态', slot: 'progStatus' },
])
</script>

<template>
  <div class="page-container ota-page">
    <PageHeader
      title="OTA 升级"
      subtitle="固件管理与设备升级任务"
      :icon="UploadFilled"
    >
      <template #actions>
        <el-button :icon="Refresh" @click="activeTab === 'firmware' ? loadFirmware() : loadTasks()">
          刷新
        </el-button>
      </template>
    </PageHeader>

    <el-tabs v-model="activeTab" class="glass-card ota-tabs">
      <!-- Firmware Tab -->
      <el-tab-pane label="固件管理" name="firmware">
        <div class="tab-toolbar">
          <span class="tab-label">固件包列表</span>
          <el-button type="primary" :icon="Upload" @click="uploadVisible = true">
            上传固件
          </el-button>
        </div>
        <IotTable :columns="firmwareColumns" :data="firmwareList" :loading="loading" :is-page="false">
          <template #fwStatus="{ row }">
            <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
          <template #fwCz="{ row }">
            <el-button v-if="row.status !== 'PUBLISHED'" link size="small" type="primary" @click="onPublish(row.id)">
              发布
            </el-button>
            <el-button v-if="row.status === 'PUBLISHED'" link size="small" type="success" @click="openCreateTask(row.id)">
              推送升级
            </el-button>
            <el-button link size="small" type="danger" @click="onDelete(row.id)">
              删除
            </el-button>
          </template>
        </IotTable>
      </el-tab-pane>

      <!-- Task Tab -->
      <el-tab-pane label="升级任务" name="task">
        <IotTable :columns="taskColumns" :data="taskList" :loading="loading" :is-page="false">
          <template #taskStatus="{ row }">
            <el-tag :type="row.status === 'COMPLETED' ? 'success' : row.status === 'RUNNING' ? 'warning' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
          <template #taskCz="{ row }">
            <el-button link size="small" type="primary" @click="onTaskDetail(row.id)">
              详情
            </el-button>
          </template>
        </IotTable>
      </el-tab-pane>
    </el-tabs>

    <!-- Upload Dialog -->
    <el-dialog v-model="uploadVisible" title="上传固件" width="500px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="产品类型">
          <el-select v-model="filterProductTypeId" placeholder="全部类型" clearable filterable style="width: 100%">
            <el-option v-for="t in productTypes" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="uploadForm.productId" placeholder="选择产品" filterable style="width: 100%">
            <el-option v-for="p in filteredProducts" :key="p.id" :label="p.model" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="uploadForm.name" placeholder="如: 传感器固件 v2" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="uploadForm.version" placeholder="如: 1.2.0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="固件文件">
          <el-upload :auto-upload="false" :on-change="onUploadFile" :limit="1">
            <el-button type="primary" size="small">
              选择文件
            </el-button>
            <template #tip>
              <div class="upload-tip">
                支持 .bin .hex .img 等格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="onSubmitUpload">
          确认上传
        </el-button>
      </template>
    </el-dialog>

    <!-- Create Task Dialog -->
    <el-dialog v-model="taskDialogVisible" title="推送升级" width="500px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="固件">
          <span>{{ firmwareName(taskForm.firmwareId) }}</span>
        </el-form-item>
        <el-form-item label="目标分组">
          <el-select v-model="taskForm.groupId" placeholder="选择分组(可选)" clearable style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="指定设备">
          <el-select v-model="taskForm.deviceIds" placeholder="选择设备" multiple filterable style="width: 100%" :disabled="!!taskForm.groupId">
            <el-option v-for="d in devices" :key="d.id" :label="`${d.deviceName} (${d.deviceKey})`" :value="d.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="onSubmitTask">
          确认推送
        </el-button>
      </template>
    </el-dialog>

    <!-- Task Detail Dialog -->
    <el-dialog v-model="taskDetailVisible" title="升级任务详情" width="600px" destroy-on-close @close="onTaskDetailClose">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="固件">
          {{ firmwareName(taskDetail?.firmwareId) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ taskDetail?.status }}
        </el-descriptions-item>
        <el-descriptions-item label="总数">
          {{ taskDetail?.total }}
        </el-descriptions-item>
        <el-descriptions-item label="成功">
          {{ taskDetail?.success }}
        </el-descriptions-item>
        <el-descriptions-item label="失败">
          {{ taskDetail?.fail }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ taskDetail?.createTime }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="taskDetail?.progress" class="task-progress">
        <div class="task-progress-label">
          设备进度
        </div>
        <IotTable :columns="progressColumns" :data="Object.entries(taskDetail.progress).map(([k, v]) => ({ deviceId: k, status: v }))" :is-page="false" density="compact">
          <template #progStatus="{ row }">
            <el-tag :type="row.status === 'SUCCESS' ? 'success' : row.status === 'FAIL' ? 'danger' : 'warning'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </IotTable>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.ota-tabs {
  padding: var(--space-lg);
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.tab-label {
  font-size: 14px;
  color: var(--iot-color-text-muted);
}

.upload-tip {
  font-size: 12px;
  color: var(--iot-color-text-muted);
}

.task-progress {
  margin-top: var(--space-md);

  &-label {
    font-size: 13px;
    margin-bottom: var(--space-sm);
    color: var(--iot-color-text-secondary);
  }
}
</style>
