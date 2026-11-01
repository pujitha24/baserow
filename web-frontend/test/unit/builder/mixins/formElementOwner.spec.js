import { mount } from '@vue/test-utils'
import { h } from 'vue'
import formElement from '@baserow/modules/builder/mixins/formElement'
import formDataStore from '@baserow/modules/builder/store/formData'

const page = {}
const dispatch = (name, payload) => {
  const action = name.split('/')[1]
  formDataStore.actions[action](
    { commit: (m, p) => formDataStore.mutations[m](formDataStore.state, p) },
    payload
  )
}

const makeComponent = () => ({
  mixins: [formElement],
  computed: {
    uniqueElementId: () => '42',
    elementType: () => ({
      formDataType: () => 'array',
      isValid: () => true,
    }),
    applicationContext: () => ({}),
    formElementTouched: () => false,
    resolvedDefaultValue: () => [1],
    elementFormDataValue() {
      return page.formData?.[42]?.value
    },
  },
  render: () => h('div'),
})

describe('formElement mixin owner id', () => {
  test('an unmounting instance keeps the entry written by a new instance', () => {
    const mocks = { $store: { dispatch, getters: {} } }
    const oldInstance = mount(makeComponent(), {
      props: { element: { id: 42 } },
      global: {
        mocks,
        provide: {
          elementPage: page,
          workspace: {},
          builder: {},
          currentPage: page,
          mode: 'public',
        },
      },
    })
    const newInstance = mount(makeComponent(), {
      props: { element: { id: 42 } },
      global: {
        mocks,
        provide: {
          elementPage: page,
          workspace: {},
          builder: {},
          currentPage: page,
          mode: 'public',
        },
      },
    })
    oldInstance.unmount()
    expect(page.formData[42].value).toStrictEqual([1])
    newInstance.unmount()
    expect(page.formData[42]).toBeUndefined()
  })
})
