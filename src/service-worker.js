importScripts('./ngsw-worker.js');

//Sync IdbProjet ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data') {
    // call method
    event.waitUntil(getDataAndSend());
  }
});

function getUserId(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          addData(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addData(userId, data) {
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/'+userId+'/projets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      del(data.id);
      console.log('Données enregistrées sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getDataAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getData(db);
  };
}

function getData(db) {
  const transaction = db.transaction('projet', "readwrite");
  const objectStore = transaction.objectStore('projet');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserId(request.result);
        console.log('Projet ajouté : ', request.result);
        cursor.continue();
      };
    }
    else
      {
        console.log('Pas plus d\'entrées !');
      }
  }
}

function del(key) {
    let db;
    const request = indexedDB.open('Castor');
    request.onerror = (event) => {
      console.log('Please allow my web app to use IndexedDB');
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      const transaction = db.transaction('projet', "readwrite");
      const objectStore = transaction.objectStore('projet');

      const del = objectStore.delete(key);
      del.onsuccess = function () {
        // On indique le succès de l'opération
        console.log('Données vidées du navigateur');
      }
      del.onerror = () => {
        // Handle errors!
        console.log('Données non vidées du navigateur');
      };
    }
}

//Sync IdbSecteur ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data-secteur') {
    // call method
    event.waitUntil(getSecteurAndSend());
  }
});

function getUserIdSecteur(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          addSecteur(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addSecteur(userId, data) {
  const projetId = data.projetId;
  console.log('projetId', projetId);
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/'+userId+'/projets/'+projetId+'/secteurs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      delSecteur(data.id);
      console.log('Données enregistrées sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getSecteurAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getSecteur(db);
  };
}

function getSecteur(db) {
  const transaction = db.transaction('secteur', "readwrite");
  const objectStore = transaction.objectStore('secteur');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserIdSecteur(request.result);
        console.log('Données ajoutées : ', request.result);
        cursor.continue();
      };
    }
    else
    {
      console.log('Pas plus d\'entrées !');
    }
  }
}

function delSecteur(key) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('secteur', "readwrite");
    const objectStore = transaction.objectStore('secteur');

    const del = objectStore.delete(key);
    del.onsuccess = function () {
      // On indique le succès de l'opération
      console.log('Données vidées du navigateur');
    }
    del.onerror = () => {
      // Handle errors!
      console.log('Données non vidées du navigateur');
    };
  }
}

//Sync IdbEnsemble ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data-ensemble') {
    // call method
    event.waitUntil(getEnsembleAndSend());
  }
});

function getUserIdEnsemble(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          //addUnite(request.result.userId, data);
          addEnsemble(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addEnsemble(userId, data) {
  const projetId = data.projetId;
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/' + userId + '/projets/' + projetId + '/ensembles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      delEnsemble(data.id);
      console.log('Ensemble enregistré sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getEnsembleAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getEnsemble(db);
  };
}

function getEnsemble(db) {
  const transaction = db.transaction('ensemble', "readwrite");
  const objectStore = transaction.objectStore('ensemble');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserIdEnsemble(request.result);
        console.log('Données ajoutées : ', request.result);
        cursor.continue();
      };
    }
    else
    {
      console.log('Pas plus d\'entrées !');
    }
  }
}

function delEnsemble(key) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('ensemble', "readwrite");
    const objectStore = transaction.objectStore('ensemble');

    const del = objectStore.delete(key);
    del.onsuccess = function () {
      // On indique le succès de l'opération
      console.log('Données vidées du navigateur');
    }
    del.onerror = () => {
      // Handle errors!
      console.log('Données non vidées du navigateur');
    };
  }
}

//Sync IdbFait ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data-fait') {
    // call method
    event.waitUntil(getFaitAndSend());
  }
});

function getUserIdFait(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          addFait(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addFait(userId, data) {
  const projetId = data.projetId;
  console.log('projetId', projetId);
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/'+userId+'/projets/'+projetId+'/faits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      delFait(data.id);
      console.log('Fait enregistré sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getFaitAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getFait(db);
  };
}

function getFait(db) {
  const transaction = db.transaction('fait', "readwrite");
  const objectStore = transaction.objectStore('fait');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserIdFait(request.result);
        console.log('Données ajoutées : ', request.result);
        cursor.continue();
      };
    }
    else
    {
      console.log('Pas plus d\'entrées !');
    }
  }
}

function delFait(key) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('fait', "readwrite");
    const objectStore = transaction.objectStore('fait');

    const del = objectStore.delete(key);
    del.onsuccess = function () {
      // On indique le succès de l'opération
      console.log('Données vidées du navigateur');
    }
    del.onerror = () => {
      // Handle errors!
      console.log('Données non vidées du navigateur');
    };
  }
}

//Sync IdbUnite ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data-unite') {
    // call method
    event.waitUntil(getUniteAndSend());
  }
});

function getUserIdUnite(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          addUnite(request.result.userId, data);
          //getUnitesFromServer(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addUnite(userId, data) {
  const projetId = data.projetId;
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/'+userId+'/projets/'+projetId + '/unites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      delUnite(data.id);
      console.log('US enregistrée sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getUniteAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getUnite(db);
  };
}

function getUnite(db) {
  const transaction = db.transaction('unite', "readwrite");
  const objectStore = transaction.objectStore('unite');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserIdUnite(request.result);
        console.log('Données ajoutées : ', request.result);
        cursor.continue();
      };
    }
    else
    {
      console.log('Pas plus d\'entrées !');
    }
  }
}

function delUnite(key) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('unite', "readwrite");
    const objectStore = transaction.objectStore('unite');

    const del = objectStore.delete(key);
    del.onsuccess = function () {
      // On indique le succès de l'opération
      console.log('Données vidées du navigateur');
    }
    del.onerror = () => {
      // Handle errors!
      console.log('Données non vidées du navigateur');
    };
  }
}

//Sync Unite Identification ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data-unite-identification') {
    // call method
    event.waitUntil(getUniteIdentificationAndSend());
  }
});

function getUserIdUniteIdentification(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          //addUnite(request.result.userId, data);
          addUniteIdentification(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addUniteIdentification(userId, data) {
  const projetId = data.projetId;
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/' + userId + '/projets/' + projetId + '/identifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      delUniteIdentification(data.id);
      console.log('Identification enregistrée sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getUniteIdentificationAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getUniteIdentification(db);
  };
}

function getUniteIdentification(db) {
  const transaction = db.transaction('uniteIdentification', "readwrite");
  const objectStore = transaction.objectStore('uniteIdentification');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserIdUniteIdentification(request.result);
        console.log('Données ajoutées : ', request.result);
        cursor.continue();
      };
    }
    else
    {
      console.log('Pas plus d\'entrées !');
    }
  }
}

function delUniteIdentification(key) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('uniteIdentification', "readwrite");
    const objectStore = transaction.objectStore('uniteIdentification');

    const del = objectStore.delete(key);
    del.onsuccess = function () {
      // On indique le succès de l'opération
      console.log('Données vidées du navigateur');
    }
    del.onerror = () => {
      // Handle errors!
      console.log('Données non vidées du navigateur');
    };
  }
}

//Sync Fait Identification ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data-fait-identification') {
    // call method
    event.waitUntil(getFaitIdentificationAndSend());
  }
});

function getUserIdFaitIdentification(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          //addUnite(request.result.userId, data);
          addfaitIdentification(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addfaitIdentification(userId, data) {
  const projetId = data.projetId;
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/' + userId + '/projets/' + projetId + '/faitidentifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      delFaitIdentification(data.id);
      console.log('FaitIdentification enregistrée sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getFaitIdentificationAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getFaitIdentification(db);
  };
}

function getFaitIdentification(db) {
  const transaction = db.transaction('faitIdentification', "readwrite");
  const objectStore = transaction.objectStore('faitIdentification');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserIdFaitIdentification(request.result);
        console.log('Données ajoutées : ', request.result);
        cursor.continue();
      };
    }
    else
    {
      console.log('Pas plus d\'entrées !');
    }
  }
}

function delFaitIdentification(key) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('faitIdentification', "readwrite");
    const objectStore = transaction.objectStore('faitIdentification');

    const del = objectStore.delete(key);
    del.onsuccess = function () {
      // On indique le succès de l'opération
      console.log('Données vidées du navigateur');
    }
    del.onerror = () => {
      // Handle errors!
      console.log('Données non vidées du navigateur');
    };
  }
}

//Sync Ensemble Identification ***********************************************************************************

self.addEventListener('sync', (event) => {
  if (event.tag === 'post-data-ensemble-identification') {
    // call method
    event.waitUntil(getEnsembleIdentificationAndSend());
  }
});

function getUserIdEnsembleIdentification(data) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('isAuth');
    const objectStore = transaction.objectStore('isAuth');

    objectStore.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const request = objectStore.get(cursor.key);
        request.onerror = () => {
          // Handle errors!
        };
        request.onsuccess = () => {
          // Do something with the request.result!
          //addUnite(request.result.userId, data);
          addEnsembleIdentification(request.result.userId, data);
        };
      } else {
        console.log('Pas d\'entrées !');
      }
    }
  }
}

function addEnsembleIdentification(userId, data) {
  const projetId = data.projetId;
  fetch('https://sheltered-savannah-51502.herokuapp.com/users/' + userId + '/projets/' + projetId + '/ensembleidentifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(() => {
      delEnsembleIdentification(data.id);
      console.log('EnsIdentification enregistrée sur le serveur');
    })
    .catch(() => console.log('Base de données non accessible, les données sont toujours dans le navigateur'));
}

function getEnsembleIdentificationAndSend() {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    getEnsembleIdentification(db);
  };
}

function getEnsembleIdentification(db) {
  const transaction = db.transaction('ensembleIdentification', "readwrite");
  const objectStore = transaction.objectStore('ensembleIdentification');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const request = objectStore.get(cursor.key);
      request.onerror = () => {
        // Handle errors!
      };
      request.onsuccess = () => {
        // Do something with the request.result!
        getUserIdEnsembleIdentification(request.result);
        console.log('Données ajoutées : ', request.result);
        cursor.continue();
      };
    }
    else
    {
      console.log('Pas plus d\'entrées !');
    }
  }
}

function delEnsembleIdentification(key) {
  let db;
  const request = indexedDB.open('Castor');
  request.onerror = (event) => {
    console.log('Please allow my web app to use IndexedDB');
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction('ensembleIdentification', "readwrite");
    const objectStore = transaction.objectStore('ensembleIdentification');

    const del = objectStore.delete(key);
    del.onsuccess = function () {
      // On indique le succès de l'opération
      console.log('Données vidées du navigateur');
    }
    del.onerror = () => {
      // Handle errors!
      console.log('Données non vidées du navigateur');
    };
  }
}
