const todo = document.getElementById('todo')
const btn = document.querySelector('.btn')
const tambah = document.querySelector('.list-item')
const hapus = document.getElementsByClassName('hapus')

// Membuat fungsi hapus untuk list default atau yang sudah ada
for(let i = 0; i < hapus.length; i++){
    hapus[i].addEventListener('click', () => {
        hapus[i].parentElement.style.display = 'none'
    })
}


btn.addEventListener('click', () => {
    const li = document.createElement('li')
    const span = document.createElement('span')
    const value = document.createTextNode(todo.value)
    const icon = document.createTextNode('\u00D7')
    span.className = 'hapus'
    span.appendChild(icon)
    li.appendChild(span)
    li.appendChild(value)
    if(todo.value === ""){
        alert('Masukan todo terlebih dahulu')
    } else {
        // Menambahkan value yang kita masukan kedalam list
        tambah.appendChild(li)

        // Mengembalikan value pada input supaya kosong
        todo.value = ''

        // Membuat fungsi untuk mengaktifkan tombol hapus dari todo yang baru dibuat
        Array.from(hapus).forEach(item => {
            item.addEventListener('click', () => {
                item.parentElement.style.display = 'none'
            })
        })
    } 
})

// Membuat fungsi untuk mencoret todo yang sudah selesai
tambah.addEventListener('click', (e) => {
    if(e.target.tagName === 'LI'){
        e.target.classList.toggle("checked")
    }
})