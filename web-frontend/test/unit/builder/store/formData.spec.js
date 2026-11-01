import formDataStore from '@baserow/modules/builder/store/formData'

describe('formData store', () => {
  test('removeFormData deletes a repeated form data entry by unique element id', () => {
    const page = {}
    const commit = (mutation, payload) => {
      formDataStore.mutations[mutation](formDataStore.state, payload)
    }

    formDataStore.actions.setFormData(
      { commit },
      {
        page,
        uniqueElementId: '42.0',
        payload: {
          value: 'first',
          elementId: 42,
        },
      }
    )
    formDataStore.actions.setFormData(
      { commit },
      {
        page,
        uniqueElementId: '42.1',
        payload: {
          value: 'second',
          elementId: 42,
        },
      }
    )

    formDataStore.actions.removeFormData(
      { commit },
      {
        page,
        uniqueElementId: '42.0',
      }
    )

    expect(page.formData).toStrictEqual({
      42: [
        {
          value: 'second',
          elementId: 42,
        },
      ],
    })
  })

  test('removeFormData deletes all form data for an element', () => {
    const page = {
      formData: {
        42: [
          {
            value: 'first',
            elementId: 42,
          },
        ],
        43: {
          value: 'other',
          elementId: 43,
        },
      },
    }
    const commit = (mutation, payload) => {
      formDataStore.mutations[mutation](formDataStore.state, payload)
    }

    formDataStore.actions.removeFormData(
      { commit },
      {
        page,
        uniqueElementId: '42',
      }
    )

    expect(page.formData).toStrictEqual({
      43: {
        value: 'other',
        elementId: 43,
      },
    })
  })

  test('removeFormData keeps an entry that now belongs to another owner', () => {
    const page = {}
    const commit = (mutation, payload) => {
      formDataStore.mutations[mutation](formDataStore.state, payload)
    }
    const uniqueElementId = '42'

    // The new instance mounts first and writes the entry.
    formDataStore.actions.setFormData(
      { commit },
      { page, uniqueElementId, payload: { value: [1], ownerId: 2 } }
    )
    // The old instance unmounts afterwards.
    formDataStore.actions.removeFormData(
      { commit },
      { page, uniqueElementId, ownerId: 1 }
    )
    expect(page.formData[42].value).toStrictEqual([1])

    formDataStore.actions.removeFormData(
      { commit },
      { page, uniqueElementId, ownerId: 2 }
    )
    expect(page.formData[42]).toBeUndefined()
  })
})
